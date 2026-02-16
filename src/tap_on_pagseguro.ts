import { NitroModules } from 'react-native-nitro-modules';

import type { SettingData } from "./interfaces/common";
import type { ThemeSettings } from "./interfaces/theme";
import type { PaymentResult } from "./interfaces/payment";
import type { TaponPagseguro } from './TaponPagseguro.nitro';
import { ErrorCode, PaymentError, RefundError, SetupError, throw_if_error } from "./interfaces/exceptions";

const TaponPagseguroHybridObject = NitroModules.createHybridObject<TaponPagseguro>('TaponPagseguro');

const MIN_AMOUNT_CENTS = 100;           // R$ 1,00
const MAX_AMOUNT_CENTS = 10_000_00;     // R$ 10.000,00
const HEX_COLOR_REGEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/;

export default class TapOn {
    /**
    * Inicializa o serviço Tap On.
    * 
    * Deve ser chamado **uma única vez** no ciclo de vida do aplicativo,
    * preferencialmente no início (ex: App.tsx ou splash screen).
    * 
    * @param data Configurações do aplicativo. O campo `theme` é opcional e pode ser passado aqui ou via `set_theme()`.
    * @throws {SetupError} Se algum parâmetro obrigatório estiver inválido ou se as cores do tema forem inválidas(caso existam)
    */
    static initialize(data: SettingData): void {
        validate_setting_data(data);
        TaponPagseguroHybridObject.initialize(data)
    };

    /**
    * Define as configurações de tema visual para as telas exibidas pela extensão Tap On.
    * 
    * Pode ser chamado **a qualquer momento após** a inicialização.
    * As cores devem estar no formato hexadecimal `#RRGGBB` ou `#RRGGBBAA` (case insensitive).
    * Campos omitidos mantêm o tema padrão da extensão.
    * 
    * @param data Configurações de tema (todas as propriedades são opcionais)
    * @throws {SetupError} Se alguma cor estiver em formato inválido
    * 
    * @example
    * TapOn.set_theme({
    *   toolbar_color: "#1E40AF",
    *   toolbar_text_color: "#FFFFFF",
    *   button_background_color: "#3B82F6",
    *   button_text_color: "#FFFFFF",
    *   status_bar_color: "#1E3A8A"
    * });
    */
    static set_theme(data: ThemeSettings): void {
        validate_theme_settings(data);
        TaponPagseguroHybridObject.setTheme(data);
    };

    /**
    * Verifica se o dispositivo possui hardware compatível com NFC.
    * 
    * **Não requer inicialização prévia.**
    * 
    * > Este método verifica a **capacidade física** do dispositivo para realizar pagamentos por aproximação (NFC).
    * > Mesmo que retorne `true`, ainda é necessário verificar se a extensão Tap On é compativel 
    * > (`is_extension_suported()`) e se o NFC está ativado (`is_nfc_enabled()`).
    * 
    * @example
    * if (!TapOn.is_nfc_supported()) {
    *   alert("Seu dispositivo não suporta pagamentos por aproximação (NFC).");
    *   return;
    * }
    */
    static is_nfc_supported(): boolean {
        return TaponPagseguroHybridObject.isNfcSupported();
    }

    /**
    * Verifica se o NFC está ativado nas configurações do dispositivo.
    * 
    * **Não requer inicialização prévia.**
    * 
    * > Retorna `true` apenas se o usuário tiver ativado o NFC manualmente nas configurações do Android.
    * > Se retornar `false`, você pode orientar o usuário a ativar o NFC antes de prosseguir com pagamentos por aproximação. 
    * @example
    * if (TapOn.is_nfc_supported() && !TapOn.is_nfc_enabled()) {
    *   // Mostrar tela ou toast pedindo para ativar NFC
    *   alert("Por favor, ative o NFC nas configurações do dispositivo para continuar.");
    * }
    */
    static is_nfc_enabled(): boolean {
        return TaponPagseguroHybridObject.isNfcEnabled();
    }

    /**
    * Verifica se o dispositivo suporta a funcionalidade Tap On (NFC + hardware compatível).
    * 
    * **Não requer inicialização prévia.**
    * 
    * > Diferente de `is_extension_available()`, que verifica apenas se o pacote está instalado,
    * > este método verifica se o hardware do dispositivo é compatível com pagamentos por aproximação via Tap On.
    */
    static is_extension_suported(): boolean {
        return TaponPagseguroHybridObject.isExtensionSupported();
    }

    /**
     * Verifica se o pacote da extensão Tap On está instalado no dispositivo.
     * 
     * **Não requer inicialização prévia.**
     *
     * > Utilize este método para detectar se o usuário já possui a extensão antes de tentar realizar uma transação.
     * 
     * > Se não estiver disponível, chame {@link get_extension_on_playstore} para redirecionar.
     *
     * @example
     * if (!TapOn.is_extension_available()) {
     *   // Redirecionar o usuário para pagina da extenção na loja.
     *   TapOn.get_extension_on_playstore();
     * }
     */
    static is_extension_available(): boolean {
        return TaponPagseguroHybridObject.isPackageAvailable();
    };
    /**
     * Redireciona o usuário para a página da extensão Tap On na Google Play Store.
     * 
     * **Não requer inicialização prévia.**
     *
     * > **Prática recomendada (PagBank):** Crie um fluxo no seu app que
     * > oriente o usuário a baixar a extensão e fazer login antes de efetuar as primeiras vendas.
     */
    static get_extension_on_playstore(): void {
        TaponPagseguroHybridObject.openPackageOnPlaystore();
    };
    /**
     * Inicia uma transação de pagamento por aproximação (NFC) via Tap On.
     * 
     * > **Nota:** Na primeira venda o Tap On inicia automaticamente o
     * > fluxo de login do vendedor.
     *
     * @param amount - Valor da transação em centavos. Deve estar entre R$ 1,00 (100 centavos) e R$ 10.000,00 (1000000 centavos).
     * @throws {PaymentError} Em caso de recusa, erro de comunicação, timeout, etc.
     * @throws {SetupError} Em caso de campo inválido.
     * @example
     * try {
     *   const resultado = await TapOn.request_payment(25000); // R$250.00
     *   console.log('Código da transação:', resultado.transaction_code);
     *   console.log('Bandeira:', resultado.card_brand);
     * } catch (e) {
     *   if (e instanceof PaymentError) {
     *     console.error(`[${e.code}] ${e.message}`);
     *   }
     * }
     */
    static async request_payment(amount: number): Promise<PaymentResult> {
        validate_amount(amount, "request_payment");

        const r = await TaponPagseguroHybridObject.requestPayment(amount);

        throw_if_error(r, PaymentError);

        return (r as PaymentResult)
    };
    /**
    * Solicita o reembolso (estorno) total ou parcial de uma transação anterior.
    * 
    * @param transaction_code Código único da transação original (obtido em `PaymentResult`)
    * @param amount Valor a ser estornado (deve ser ≤ valor original da transação)
    * 
    * @throws {RefundError} Em caso de falha no extorno
    * @throws {SetupError} Em caso de campos inválidos.
    */
    static async request_refund(transaction_code: string, amount: number): Promise<boolean> {
        validate_transaction_code(transaction_code, "request_refund");
        validate_amount(amount, "request_refund");

        const r = await TaponPagseguroHybridObject.requestRefund(transaction_code, amount);

        throw_if_error(r, RefundError);

        return (r as boolean);
    }
}

function validate_setting_data(data: SettingData): void {
    if (!data || typeof data !== 'object') {
        throw new SetupError(ErrorCode.INVALID_PARAM, 'initialize: dados de configuração inválidos');
    }
    if (typeof data.app_key !== 'string' || !data.app_key.trim()) {
        throw new SetupError(ErrorCode.INVALID_PARAM, 'initialize: app_key é obrigatório e não pode ser vazio');
    }
    if (typeof data.app_name !== 'string' || !data.app_name.trim()) {
        throw new SetupError(ErrorCode.INVALID_PARAM, 'initialize: app_name é obrigatório e não pode ser vazio');
    }
    if (typeof data.app_version !== 'string' || !data.app_version.trim()) {
        throw new SetupError(ErrorCode.INVALID_PARAM, 'initialize: app_version é obrigatório e não pode ser vazio');
    }
    if (data.theme) validate_theme_settings(data.theme);
}

function validate_transaction_code(code: string, methodName: string): void {
    if (typeof code !== 'string') throw new SetupError(ErrorCode.INVALID_PARAM, `${methodName}: código da transação deve ser string`);
    if (!code.trim()) throw new SetupError(ErrorCode.INVALID_PARAM, `${methodName}: código da transação não pode ser vazio`);
}

function validate_amount(amount: number, methodName: string): void {
    if (typeof amount !== 'number' || isNaN(amount) || !isFinite(amount)) {
        throw new SetupError(ErrorCode.INVALID_PARAM, `${methodName}: o valor deve ser um número válido`);
    }
    if (!Number.isInteger(amount)) {
        throw new SetupError(ErrorCode.INVALID_PARAM, `${methodName}: o valor deve ser em centavos (número inteiro sem casas decimais)`);
    }
    if (amount < MIN_AMOUNT_CENTS) {
        throw new SetupError(ErrorCode.INVALID_PARAM, `${methodName}: valor mínimo permitido é R$ 1,00 (${MIN_AMOUNT_CENTS} centavos)`);
    }
    if (amount > MAX_AMOUNT_CENTS) {
        throw new SetupError(ErrorCode.INVALID_PARAM, `${methodName}: valor máximo permitido é R$ 10.000,00 (${MAX_AMOUNT_CENTS} centavos)`);
    }
    if (amount <= 0) {
        throw new SetupError(ErrorCode.INVALID_PARAM, `${methodName}: o valor deve ser positivo`);
    }
}

function validate_theme_settings(settings: ThemeSettings): void {
    validate_hex_color(settings.toolbar_text_color, 'toolbar_text_color');
    validate_hex_color(settings.toolbar_color, 'toolbar_color');
    validate_hex_color(settings.status_bar_color, 'status_bar_color');
    validate_hex_color(settings.button_background_color, 'button_background_color');
    validate_hex_color(settings.button_text_color, 'button_text_color');
}

function validate_hex_color(color: string | undefined, fieldName: string): void {
    if (color === undefined) return;
    if (typeof color !== 'string' || !HEX_COLOR_REGEX.test(color)) {
        throw new SetupError(ErrorCode.INVALID_PARAM, `Tema inválido: ${fieldName} deve ser uma cor hexadecimal válida (#RRGGBB ou #RRGGBBAA). Recebido: "${color}"`);
    }
}