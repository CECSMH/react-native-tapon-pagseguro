package com.margelo.nitro.taponpagseguro.dtos

import android.os.Parcelable
import com.google.gson.Gson
import kotlinx.parcelize.Parcelize

@Parcelize
data class TapOnVoidPaymentData(
    val refCode: String,
    val transactionCode: String,
    val amount: Double,
    val appKey: String,
    val appName: String,
    val appVersion: String,
    val androidId: String,
    val themeSettings: TapOnThemeConfigModel?
) : Parcelable {

    fun toJson(): String {
        return Gson().toJson(this)
    }

    companion object {
        fun fromJson(json: String): TapOnVoidPaymentData {
            return Gson().fromJson(json, TapOnVoidPaymentData::class.java)
        }
    }
}
