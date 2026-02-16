package com.margelo.nitro.taponpagseguro
  
import com.margelo.nitro.taponpagseguro.dtos.TapOnThemeConfigModel

import com.facebook.proguard.annotations.DoNotStrip

import kotlinx.coroutines.*
import com.margelo.nitro.core.Promise
import com.margelo.nitro.NitroModules

import android.nfc.NfcAdapter

import android.content.Context
import androidx.appcompat.app.AppCompatActivity
import com.facebook.react.bridge.ReactApplicationContext

@DoNotStrip
class TaponPagseguro : HybridTaponPagseguroSpec() {
  private val android_context: ReactApplicationContext? get() = NitroModules.applicationContext

  private var tapon_deeplink_handler: DeeplinkHandler? = null
  private val nfc_default_adapter: NfcAdapter? by lazy { NfcAdapter.getDefaultAdapter(android_context) }

  private val current_activity: AppCompatActivity? get() = android_context?.currentActivity as? AppCompatActivity;

  init {}
  
  override fun initialize(data: SettingData): Unit {
    current_activity?.let {
      tapon_deeplink_handler = DeeplinkHandler(it);
      tapon_deeplink_handler?.initialize(data);
      data.theme?.let {
         tapon_deeplink_handler?.setTheme(TapOnThemeConfigModel.fromThemeSettings(it))
      }
    }
  }

  override fun setTheme(data: ThemeSettings): CustomError? {
    validate_extension_availability()?.let{ return it }
    tapon_deeplink_handler?.setTheme(TapOnThemeConfigModel.fromThemeSettings(data))
    return null;
  }

  override fun isNfcEnabled(): Boolean { return nfc_default_adapter?.isEnabled == true }
  
  override fun isNfcSupported(): Boolean { return nfc_default_adapter != null }
  
  override fun isPackageAvailable(): Boolean { return current_activity?.let{DeeplinkHandler.isPackageAvailable(it)} ?: false  }

  override fun isExtensionSupported(): Boolean { return android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R && isNfcSupported() }

  override fun openPackageOnPlaystore(): Unit { current_activity?.let{DeeplinkHandler.openPackageInPlayStore(it)} }
  
  override fun requestPayment(amount: Double): Promise<Variant_CustomError_PaymentResult> {
    return Promise.async {
      validate_extension_availability()?.let{ return@async Variant_CustomError_PaymentResult.create(it) }

      val result = try {
        tapon_deeplink_handler?.requestPayment(amount)
      } catch (e: Exception) {
        return@async Variant_CustomError_PaymentResult.create(CustomError(ErrorCode.UNEXPECTED_ERROR, e.message ?: "Ocorreu um erro desconhecido ao tentar realizar o pagamento"))
      }

      when (result) {
        is DeeplinkHandler.Result.PaymentSuccess -> Variant_CustomError_PaymentResult.create(result.transaction.toPaymentResult())
        is DeeplinkHandler.Result.Error -> Variant_CustomError_PaymentResult.create(CustomError(result.code, result.message))
        else -> Variant_CustomError_PaymentResult.create(CustomError(ErrorCode.UNEXPECTED_ERROR, "Ocorreu um erro desconhecido ao tentar realizar o pagamento"))
      }
    }
  }
  
  override fun requestRefund(transaction_code: String, amount: Double): Promise<Variant_Boolean_CustomError> {
    return Promise.async {
      validate_extension_availability()?.let{ return@async Variant_Boolean_CustomError.create(it) }

      val result = try {
        tapon_deeplink_handler?.requestRefund(transaction_code, amount)
      } catch (e: Exception) {
        return@async Variant_Boolean_CustomError.create(CustomError(ErrorCode.UNEXPECTED_ERROR, e.message ?: "Ocorreu um erro desconhecido ao tentar realizar o pagamento"))
      }

      when (result) {
        is DeeplinkHandler.Result.RefundSuccess -> Variant_Boolean_CustomError.create(true)
        is DeeplinkHandler.Result.Error -> Variant_Boolean_CustomError.create(CustomError(result.code, result.message))
        else -> Variant_Boolean_CustomError.create(CustomError(ErrorCode.UNEXPECTED_ERROR, "Ocorreu um erro desconhecido ao tentar realizar estorno"))
      }
    }
  }

  override fun requestLogin(): Promise<Variant_Boolean_CustomError>{
    return Promise.async {
      Variant_Boolean_CustomError.create(CustomError(ErrorCode.UNEXPECTED_ERROR,"Metodo não implementado!"))
    }
  }

  override fun requestLogout(): Promise<Variant_Boolean_CustomError>{
    return Promise.async {
      Variant_Boolean_CustomError.create(CustomError(ErrorCode.UNEXPECTED_ERROR,"Metodo não implementado!"))
    }
  }

  private fun validate_extension_availability(): CustomError? {
    return if (!isExtensionSupported()) CustomError(ErrorCode.SERVICE_UNAVAILABLE, "Serviço não suportado neste dispositvo")
    else if (!isPackageAvailable()) CustomError(ErrorCode.SERVICE_UNAVAILABLE, "Extensão necessária não instalada")
    else if(tapon_deeplink_handler == null) CustomError(ErrorCode.SERVICE_UNAVAILABLE, "Serviço não inicializado")
    else null
  }
}
