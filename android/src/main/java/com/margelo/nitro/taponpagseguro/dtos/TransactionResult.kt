package com.margelo.nitro.taponpagseguro.dtos

import android.os.Parcelable
import com.google.gson.Gson
import kotlinx.parcelize.Parcelize

import com.margelo.nitro.taponpagseguro.PaymentResult
import com.margelo.nitro.taponpagseguro.PaymentTypes
import com.margelo.nitro.taponpagseguro.InstallmentTypes

@Parcelize
data class TransactionResult(
    val saleValue: Double?,
    val paymentMethod: String?,
    val transactionCode: String?,
    val transactionDateTime: String?,
    val cardHolder: String?,
    val cardBrand: String?,
    val installments: Int?,
    val installmentValue: Double?,
    val installmentMethod: String?
) : Parcelable {

    fun toJson(): String = Gson().toJson(this)

    fun toPaymentResult(): PaymentResult {
        return PaymentResult(
        amount = this.saleValue ?: 0.0,
        raw_amount = this.saleValue ?: 0.0,
        payment_method = when (this.paymentMethod) {
            "C" -> PaymentTypes.CREDIT
            "CP" -> PaymentTypes.INSTALLMENT_CREDIT
            "D" -> PaymentTypes.DEBIT
            else -> PaymentTypes.CREDIT
        },
        transaction_code = this.transactionCode ?: "",
        transaction_date_time = this.transactionDateTime ?: "",
        card_holder = this.cardHolder ?: "",
        card_brand = this.cardBrand ?: "",
        installments = this.installments?.toDouble() ?: 0.0,
        installment_value = this.installmentValue ?: 0.0,
        raw_installment_value = this.installmentValue ?: 0.0,
        installment_method = when (this.installmentMethod) {
            "PV" -> InstallmentTypes.SELLER_INSTALLMENT
            "PC" -> InstallmentTypes.BUYER_INSTALLMENT
            "AV" -> InstallmentTypes.NO_INSTALLMENT
            else -> InstallmentTypes.NO_INSTALLMENT
            }
        )
    }
    companion object {
        fun fromJson(json: String): TransactionResult = Gson().fromJson(json, TransactionResult::class.java)
    }
}