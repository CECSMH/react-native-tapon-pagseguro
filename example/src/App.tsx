import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
} from 'react-native';

import TapOn, {
  SetupError,
  PaymentError,
  RefundError,
  PaymentTypes,
  type PaymentResult,
  type ThemeSettings,
} from 'react-native-tapon-pagseguro'; // Adjust path to your library

// ─── Theme applied at startup ────────────────────────────────────────────────
const APP_THEME: ThemeSettings = {
  toolbar_color: '#1E40AF',
  toolbar_text_color: '#FFFFFF',
  button_background_color: '#3B82F6',
  button_text_color: '#FFFFFF',
  status_bar_color: '#1E3A8A',
};

function App(): React.JSX.Element {
  const [isExtensionAvailable, setIsExtensionAvailable] = useState(false);
  const [isNfcSupported, setIsNfcSupported] = useState(false);
  const [isNfcEnabled, setIsNfcEnabled] = useState(false);
  const [isExtensionSupported, setIsExtensionSupported] = useState(false);
  const [loading, setLoading] = useState(false);
  // Amount input is in centavos (integer), e.g. "2500" = R$ 25,00
  const [paymentAmountCents, setPaymentAmountCents] = useState('2500');
  const [lastTransaction, setLastTransaction] = useState<PaymentResult | null>(null);
  const [refundAmountCents, setRefundAmountCents] = useState('');

  useEffect(() => {
    checkDeviceSupport();
    initializeApp();
  }, []);

  const checkDeviceSupport = () => {
    // None of these require initialization
    const nfcSupported = TapOn.is_nfc_supported();
    const nfcEnabled = nfcSupported && TapOn.is_nfc_enabled();
    const extensionSupported = TapOn.is_extension_suported();

    setIsNfcSupported(nfcSupported);
    setIsNfcEnabled(nfcEnabled);
    setIsExtensionSupported(extensionSupported);

    if (nfcSupported && !nfcEnabled) {
      Alert.alert(
        'NFC desativado',
        'Por favor, ative o NFC nas configurações do dispositivo para continuar.'
      );
    }
  };

  const initializeApp = () => {
    try {
      TapOn.initialize({
        app_key: '<sua chave aqui>', // use .env
        app_name: 'TapOn Test App',
        app_version: '1.0.0',
        theme: APP_THEME, // theme can be passed here or via set_theme()
      });

      const available = TapOn.is_extension_available();
      setIsExtensionAvailable(available);

      if (!available) {
        Alert.alert(
          'Extensão não encontrada',
          'A extensão Tap On não está instalada. Deseja instalar?',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Instalar', onPress: handleOpenPlayStore },
          ]
        );
      }
    } catch (error) {
      if (error instanceof SetupError) {
        Alert.alert('Erro de configuração', `[${error.code}] ${error.message}`);
      } else {
        Alert.alert('Erro', 'Falha ao inicializar o TapOn');
      }
    }
  };

  const handleOpenPlayStore = () => {
    TapOn.get_extension_on_playstore();
  };

  const handleApplyTheme = () => {
    try {
      TapOn.set_theme(APP_THEME);
      Alert.alert('Tema aplicado', 'Configurações de tema enviadas com sucesso.');
    } catch (error) {
      if (error instanceof SetupError) {
        Alert.alert('Tema inválido', `[${error.code}] ${error.message}`);
      }
    }
  };

  const handlePayment = async () => {
    const amount = parseInt(paymentAmountCents, 10);

    setLoading(true);
    try {
      const result = await TapOn.request_payment(amount);

      setLastTransaction(result);
      setRefundAmountCents(String(result.raw_amount));

      const paymentTypeLabel = getPaymentTypeLabel(result.payment_method);
      const installmentLabel =
        result.installments > 1
          ? `${result.installments}x de R$ ${centsToDisplay(result.raw_installment_value)}`
          : 'À vista';

      Alert.alert(
        '✅ Pagamento Aprovado!',
        `Valor: R$ ${centsToDisplay(result.raw_amount)}\n` +
        `Tipo: ${paymentTypeLabel}\n` +
        `Bandeira: ${result.card_brand}\n` +
        `Titular: ${result.card_holder}\n` +
        `Parcelas: ${installmentLabel}\n` +
        `Código: ${result.transaction_code}\n` +
        `Data: ${new Date(result.transaction_date_time).toLocaleString('pt-BR')}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      if (error instanceof SetupError) {
        Alert.alert('Parâmetro inválido', `[${error.code}] ${error.message}`);
      } else if (error instanceof PaymentError) {
        Alert.alert('Erro no Pagamento', `[${error.code}] ${error.message}`);
      } else {
        Alert.alert('Erro', 'Erro inesperado ao processar pagamento');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!lastTransaction) {
      Alert.alert('Erro', 'Nenhuma transação disponível para estorno');
      return;
    }

    const amount = parseInt(refundAmountCents, 10);

    Alert.alert(
      'Confirmar Estorno',
      `Deseja estornar R$ ${centsToDisplay(amount)} da transação ${lastTransaction.transaction_code}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await TapOn.request_refund(lastTransaction.transaction_code, amount);

              Alert.alert(
                '✅ Estorno Realizado',
                `Valor estornado: R$ ${centsToDisplay(amount)}\n` +
                `Transação: ${lastTransaction.transaction_code}`
              );

              if (amount === lastTransaction.raw_amount) {
                setLastTransaction(null);
                setRefundAmountCents('');
              }
            } catch (error) {
              if (error instanceof SetupError) {
                Alert.alert('Parâmetro inválido', `[${error.code}] ${error.message}`);
              } else if (error instanceof RefundError) {
                Alert.alert('Erro no Estorno', `[${error.code}] ${error.message}`);
              } else {
                Alert.alert('Erro', (error as any).message);
              }
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const getPaymentTypeLabel = (type: PaymentTypes): string => {
    switch (type) {
      case PaymentTypes.CREDIT:             return 'Crédito';
      case PaymentTypes.DEBIT:              return 'Débito';
      case PaymentTypes.INSTALLMENT_CREDIT: return 'Crédito Parcelado';
      default:                              return 'Desconhecido';
    }
  };

  /** Converts integer cents to a display string, e.g. 2500 → "25,00" */
  const centsToDisplay = (cents: number): string =>
    (cents / 100).toFixed(2).replace('.', ',');

  const canTransact = isExtensionAvailable && isNfcSupported && isNfcEnabled && isExtensionSupported;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
      <ScrollView contentContainerStyle={styles.scrollView}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>TapOn PagSeguro Test</Text>
        </View>

        {/* Extension Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛒 Extensão Tap On</Text>
          <View style={styles.statusGrid}>
            <StatusRow label="Pacote instalado"          ok={isExtensionAvailable} />
            <StatusRow label="NFC suportado"             ok={isNfcSupported} />
            <StatusRow label="NFC ativado"               ok={isNfcEnabled} />
            <StatusRow label="Extensão compatível"       ok={isExtensionSupported} />
          </View>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.buttonWarning, styles.buttonFlex]}
              onPress={handleOpenPlayStore}>
              <Text style={styles.buttonText}>Abrir Play Store</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary, styles.buttonFlex, !isExtensionAvailable && styles.buttonDisabled]}
              onPress={handleApplyTheme}
              disabled={!isExtensionAvailable}>
              <Text style={styles.buttonText}>Aplicar Tema</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Payment Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💳 Pagamento</Text>
          <Text style={styles.label}>Valor em centavos (ex: 2500 = R$ 25,00)</Text>
          <TextInput
            style={styles.input}
            value={paymentAmountCents}
            onChangeText={setPaymentAmountCents}
            keyboardType="number-pad"
            placeholder="2500"
            editable={!loading}
          />
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary, (!canTransact || loading) && styles.buttonDisabled]}
            onPress={handlePayment}
            disabled={!canTransact || loading}>
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>
                {canTransact ? 'Processar Pagamento' : 'Dispositivo indisponível'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Last Transaction */}
        {lastTransaction && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 Última Transação</Text>
            <View style={styles.transactionCard}>
              <TransactionRow label="Código"   value={lastTransaction.transaction_code} />
              <TransactionRow label="Valor"    value={`R$ ${lastTransaction.raw_amount}`} />
              <TransactionRow label="Bandeira" value={lastTransaction.card_brand} />
              <TransactionRow label="Titular"  value={lastTransaction.card_holder} />
              <TransactionRow label="Tipo"     value={getPaymentTypeLabel(lastTransaction.payment_method)} />
              <TransactionRow
                label="Parcelas"
                value={
                  lastTransaction.installments > 1
                    ? `${lastTransaction.installments}x de R$ ${centsToDisplay(lastTransaction.raw_installment_value)}`
                    : 'À vista'
                }
              />
              <TransactionRow
                label="Data"
                value={new Date(lastTransaction.transaction_date_time).toLocaleString('pt-BR')}
              />
            </View>
          </View>
        )}

        {/* Refund Section */}
        {lastTransaction && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💰 Estorno</Text>
            <Text style={styles.label}>
              Valor em centavos (máx: {lastTransaction.raw_amount})
            </Text>
            <TextInput
              style={styles.input}
              value={refundAmountCents}
              onChangeText={setRefundAmountCents}
              keyboardType="number-pad"
              placeholder="2500"
              editable={!loading}
            />
            <TouchableOpacity
              style={[styles.button, styles.buttonDanger, loading && styles.buttonDisabled]}
              onPress={handleRefund}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>Estornar</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

// ─── Small reusable components ────────────────────────────────────────────────

const TransactionRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.transactionRow}>
    <Text style={styles.transactionLabel}>{label}:</Text>
    <Text style={styles.transactionValue}>{value}</Text>
  </View>
);

const StatusRow = ({ label, ok }: { label: string; ok: boolean }) => (
  <View style={styles.statusRow}>
    <View style={[styles.statusDot, { backgroundColor: ok ? '#4CAF50' : '#FF5252' }]} />
    <Text style={styles.statusText}>{label}</Text>
    <Text style={[styles.statusBadge, { color: ok ? '#4CAF50' : '#FF5252' }]}>
      {ok ? 'OK' : 'Não'}
    </Text>
  </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingTop: StatusBar.currentHeight ?? 0,
  },
  scrollView: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    color: '#333',
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  buttonFlex: {
    flex: 1,
  },
  buttonPrimary: {
    backgroundColor: '#2196F3',
  },
  buttonSecondary: {
    backgroundColor: '#4CAF50',
  },
  buttonDanger: {
    backgroundColor: '#FF5252',
  },
  buttonWarning: {
    backgroundColor: '#FF9800',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  statusGrid: {
    gap: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  statusText: {
    flex: 1,
    fontSize: 14,
    color: '#444',
  },
  statusBadge: {
    fontSize: 13,
    fontWeight: '700',
  },
  transactionCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    padding: 12,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  transactionLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  transactionValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
});

export default App;