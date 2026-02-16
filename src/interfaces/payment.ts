/**
 * Tipos de pagamento disponíveis.
 */
export enum PaymentTypes {
    /**
     * Pagamento realizado via cartão de crédito.
     */
    CREDIT = 0,
    /**
     * Pagamento realizado via cartão de débito.
     */
    DEBIT = 1,
    /**
     *  Pagamento realizado via cartão de crédito parcelado
     */
    INSTALLMENT_CREDIT = 2
}

/**
 * Tipos de parcelamento disponíveis.
 */
export enum InstallmentTypes {
    /**
     * Pagamento sem parcelamento (à vista).
     */
    NO_INSTALLMENT = 0,
    /**
     * Parcelamento realizado pelo lojista.
     */
    SELLER_INSTALLMENT = 1,
    /**
     * Parcelamento realizado pelo comprador.
     */
    BUYER_INSTALLMENT = 2,
}

export type PaymentResult = {
    amount: number
    raw_amount: number
    payment_method: PaymentTypes
    transaction_code: string,
    transaction_date_time: string,
    card_holder: string,
    card_brand: string,
    installments: number
    installment_value: number
    raw_installment_value: number,
    installment_method: InstallmentTypes
}
