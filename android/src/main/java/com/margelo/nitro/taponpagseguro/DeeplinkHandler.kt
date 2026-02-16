package com.margelo.nitro.taponpagseguro

import android.app.Activity

import android.net.Uri
import android.os.Build
import android.util.Log
import android.os.Parcelable
import android.content.Intent
import android.provider.Settings
import android.content.pm.PackageManager
import android.content.ActivityNotFoundException

import kotlinx.parcelize.Parcelize
import kotlinx.coroutines.CompletableDeferred
import java.util.UUID;
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.pm.PackageInfoCompat
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts

import com.margelo.nitro.taponpagseguro.ErrorCode

import com.margelo.nitro.taponpagseguro.dtos.ConfigData
import com.margelo.nitro.taponpagseguro.dtos.TapOnPaymentData
import com.margelo.nitro.taponpagseguro.dtos.TransactionResult
import com.margelo.nitro.taponpagseguro.dtos.TapOnVoidPaymentData
import com.margelo.nitro.taponpagseguro.dtos.TapOnThemeConfigModel

import com.margelo.nitro.taponpagseguro.constants.TapOnKeys

import com.margelo.nitro.taponpagseguro.helpers.ActivityResultFragment

class DeeplinkHandler(private val activity: AppCompatActivity) {

    companion object {
        private const val ACTION_OPEN_APP = "br.com.uol.ps.tapon.OPEN_APP"
        private const val ACTION_CONFIGURE_APP = "br.com.uol.ps.tapon.CONFIGURE_APP"

        private const val PACKAGE_PRODUCTION = "br.com.uol.ps.tapon"

        private const val CONFIGURE_ACTION_LOGIN = "LOGIN"
        private const val CONFIGURE_ACTION_LOGOUT = "LOGOUT"

        private const val MIN_VERSION_CODE_FOR_AUTH = 51

        @JvmStatic
        fun isPackageAvailable(activity: AppCompatActivity): Boolean {
            return try {
              activity.packageManager.getPackageInfo(PACKAGE_PRODUCTION,PackageManager.PackageInfoFlags.of(0))
              true
            } catch (e: PackageManager.NameNotFoundException) { false }
        }

        @JvmStatic
        fun openPackageInPlayStore(activity: AppCompatActivity) {
            try {
                val intent = Intent(Intent.ACTION_VIEW).apply {
                    data = Uri.parse("market://details?id=$PACKAGE_PRODUCTION")
                    setPackage("com.android.vending")
                }
                activity.startActivity(intent)
            } catch (e: ActivityNotFoundException) {
                val intent = Intent(Intent.ACTION_VIEW).apply {
                    data = Uri.parse("https://play.google.com/store/apps/details?id=$PACKAGE_PRODUCTION")
                }
                activity.startActivity(intent)
            }
        }
    }

    private val result_fragment: ActivityResultFragment by lazy {ActivityResultFragment.get_fragment(activity)}

    private val android_id: String by lazy {Settings.Secure.getString(activity.contentResolver, Settings.Secure.ANDROID_ID)}
    private var app_key: String = ""
    private var app_name: String = ""
    private var app_version: String = ""
    private var theme_settings: TapOnThemeConfigModel? = null

    private val package_name: String get() = PACKAGE_PRODUCTION

    private var completition_deferred: CompletableDeferred<Result>? = null

    fun initialize(data: SettingData) {
        app_key = data.app_key
        app_name = data.app_name
        app_version = data.app_version
    }

    fun setTheme(data: TapOnThemeConfigModel): Unit { theme_settings = data; }

    suspend fun requestPayment(amount: Double): Result {
        val payment_data = TapOnPaymentData(
            appKey = app_key,
            appName = app_name,
            appVersion = app_version,
            androidId = android_id,
            saleAmount = amount / 100,
            themeSettings = theme_settings
        )
        
        val intent = create_intent(ACTION_OPEN_APP, TapOnKeys.PAYMENT_DATA, payment_data.toJson())

        completition_deferred = CompletableDeferred()
            
        activity.runOnUiThread { 
            result_fragment.launchForResult(intent){ result ->
                val r = when (result.resultCode) {
                    Activity.RESULT_OK -> {
                        if(result.data?.hasExtra(TapOnKeys.SUCCESS_RESULT) == true){
                            val transaction_result = TransactionResult.fromJson(result.data?.getStringExtra(TapOnKeys.SUCCESS_RESULT)!!)

                            if (!transaction_result.transactionCode.isNullOrBlank()) {
                                Result.PaymentSuccess(transaction_result)
                            } else {
                                Result.Error(ErrorCode.INVALID_RESULT, "Resultado inválido da transação")
                            }
                        } else { Result.Error(ErrorCode.INVALID_RESULT, "Resultado inválido da transação") }
                    }
                    Activity.RESULT_CANCELED -> Result.Error(ErrorCode.OPERATION_CANCELED, "Operação cancelada.")
                    else -> Result.Unknown
                }

                completition_deferred?.complete(r)
                completition_deferred = null
            }
        }
        return completition_deferred!!.await()
    }

    suspend fun requestRefund(transactionCode: String, amount: Double): Result {
        val refund_data = TapOnVoidPaymentData(
            refCode = UUID.randomUUID().toString(),
            transactionCode = transactionCode,
            amount = amount / 100,
            appKey = app_key,
            appName = app_name,
            appVersion = app_version,
            androidId = android_id,
            themeSettings = theme_settings
        )

        val intent = create_intent(ACTION_OPEN_APP, TapOnKeys.REFUND_DATA, refund_data.toJson())

        completition_deferred = CompletableDeferred()

        activity.runOnUiThread { 
            result_fragment.launchForResult(intent){ result ->
                val r = when (result.resultCode) {
                    Activity.RESULT_OK -> Result.RefundSuccess
                    Activity.RESULT_CANCELED -> Result.Error(ErrorCode.OPERATION_CANCELED, "Operação cancelada.")
                    else -> Result.Unknown
                }

                completition_deferred?.complete(r)
                completition_deferred = null
            }
        }

        return completition_deferred!!.await()
    }

    suspend fun requestLogin(): Result {
        val config_data = ConfigData(
            appKey = app_key,
            appName = app_name,
            appVersion = app_version,
            androidId = android_id,
            themeSettings = theme_settings,
            configureAction = CONFIGURE_ACTION_LOGIN
        )

        val intent = create_intent(ACTION_CONFIGURE_APP, TapOnKeys.CONFIGURE_DATA, config_data.toJson())

        completition_deferred = CompletableDeferred()

        activity.runOnUiThread { 
            result_fragment.launchForResult(intent){ result ->
                val r = when (result.resultCode) {
                    Activity.RESULT_OK -> {
                       // Log.d("DeeplinkHandler", result.data?.getStringExtra(TapOnKeys.SUCCESS_RESULT)?: "teste")
                        Result.Unknown
                    }
                    Activity.RESULT_CANCELED -> Result.Error(ErrorCode.OPERATION_CANCELED, "Operação cancelada.")
                    else -> Result.Unknown
                }

                completition_deferred?.complete(r)
                completition_deferred = null
            }
        }

        return completition_deferred!!.await()
    }

    suspend fun requestLogout(): Result {
        val config_data = ConfigData(
            appKey = app_key,
            appName = app_name,
            appVersion = app_version,
            androidId = android_id,
            themeSettings = theme_settings,
            configureAction = CONFIGURE_ACTION_LOGOUT
        )

        val intent = create_intent(ACTION_CONFIGURE_APP, TapOnKeys.CONFIGURE_DATA, config_data.toJson())

        completition_deferred = CompletableDeferred()

        activity.runOnUiThread { 
            result_fragment.launchForResult(intent){ result ->
                val r = when (result.resultCode) {
                    Activity.RESULT_OK -> {
                        //Log.d("DeeplinkHandler", result.data?.getStringExtra(TapOnKeys.SUCCESS_RESULT)?: "teste")
                        Result.Unknown
                    }
                    Activity.RESULT_CANCELED -> Result.Error(ErrorCode.OPERATION_CANCELED, "Operação cancelada.")
                    else -> Result.Unknown
                }

                completition_deferred?.complete(r)
                completition_deferred = null
            }
        }

        return completition_deferred!!.await()
    }

    private fun create_intent(action: String, key: String, json_str: String): Intent {
        return Intent(action).addCategory(Intent.CATEGORY_DEFAULT).setPackage(package_name).putExtra(key, json_str)
    }
   
    sealed class Result {
        data class PaymentSuccess(val transaction: TransactionResult) : Result()
        object RefundSuccess : Result()
        object LoginSuccess : Result()
        object LogoutSuccess : Result()
        data class Error(val code: ErrorCode, val message: String) : Result()
        object Unknown : Result()
    }
}