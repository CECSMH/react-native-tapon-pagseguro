import type { HybridObject } from 'react-native-nitro-modules';
import type { SettingData } from './interfaces/common';
import type { ThemeSettings } from './interfaces/theme';
import type { PaymentResult } from './interfaces/payment';
import type { CustomError } from './interfaces/exceptions';

export interface TaponPagseguro extends HybridObject<{ android: 'kotlin' }> {
  initialize(data: SettingData): void;
  setTheme(data: ThemeSettings): CustomError | undefined;

  isPackageAvailable(): boolean;
  isNfcEnabled(): boolean;
  isNfcSupported(): boolean;
  isExtensionSupported(): boolean;
  openPackageOnPlaystore(): void;

  requestLogin(): Promise<boolean | CustomError>
  requestLogout(): Promise<boolean | CustomError>

  requestPayment(amount: number): Promise<PaymentResult | CustomError>
  requestRefund(transaction_code: string, amount: number): Promise<boolean | CustomError>
}
