package com.margelo.nitro.taponpagseguro.dtos

import com.margelo.nitro.taponpagseguro.ThemeSettings

import android.os.Parcelable
import com.google.gson.Gson
import android.graphics.Color
import kotlinx.parcelize.Parcelize

@Parcelize
data class TapOnThemeConfigModel(
    val toolbarTextColor: Int?, 
    val toolbarColor: Int?, 
    val statusBarColor: Int?,
    val buttonBackgroundColor: Int?, 
    val buttonTextColor: Int?
) : Parcelable {

    fun toJson(): String {
        return Gson().toJson(this)
    }

    companion object {
        fun fromJson(json: String): TapOnThemeConfigModel {
            return Gson().fromJson(json, TapOnThemeConfigModel::class.java)
        }

        fun fromThemeSettings(from: ThemeSettings): TapOnThemeConfigModel {
            return TapOnThemeConfigModel(
                toolbarTextColor = from.toolbar_text_color?.let { Color.parseColor(it) },
                toolbarColor = from.toolbar_color?.let { Color.parseColor(it) },
                statusBarColor = from.status_bar_color?.let { Color.parseColor(it) },
                buttonBackgroundColor = from.button_background_color?.let { Color.parseColor(it) },
                buttonTextColor = from.button_text_color?.let { Color.parseColor(it) }
            )
        }
    }
}