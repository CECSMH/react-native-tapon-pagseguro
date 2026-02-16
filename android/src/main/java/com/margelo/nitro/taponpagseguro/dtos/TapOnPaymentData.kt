package com.margelo.nitro.taponpagseguro.dtos

import android.os.Parcelable
import com.google.gson.Gson
import kotlinx.parcelize.Parcelize

@Parcelize
data class TapOnPaymentData(
    val appKey: String,
    val appName: String,
    val appVersion: String,
    val androidId: String,
    val saleAmount: Double,
    val themeSettings: TapOnThemeConfigModel?
) : Parcelable {

    fun toJson(): String = Gson().toJson(this)

    companion object {
        fun fromJson(json: String): TapOnPaymentData = Gson().fromJson(json, TapOnPaymentData::class.java)
    }
}

