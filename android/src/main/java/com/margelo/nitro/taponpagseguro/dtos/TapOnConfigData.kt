package com.margelo.nitro.taponpagseguro.dtos

import android.os.Parcelable
import com.google.gson.Gson
import kotlinx.parcelize.Parcelize
import com.margelo.nitro.taponpagseguro.dtos.TapOnThemeConfigModel

@Parcelize
data class ConfigData(
    val appKey: String,
    var appName: String?,
    val appVersion: String,
    val androidId: String,
    val themeSettings: TapOnThemeConfigModel?,
    var configureAction: String? = null
) : Parcelable {

    fun toJson(): String {
        return Gson().toJson(this)
    }

    companion object {
        fun fromJson(json: String): ConfigData {
            return Gson().fromJson(json, ConfigData::class.java)
        }
    }
}