import TapOn from "./tap_on_pagseguro";
import type { SettingData } from "./interfaces/common"
import type { ThemeSettings } from "./interfaces/theme"
import type { PaymentResult } from "./interfaces/payment"

import { InstallmentTypes, PaymentTypes } from "./interfaces/payment"
import { PaymentError, RefundError, SetupError } from "./interfaces/exceptions";

export type {
  SettingData,
  ThemeSettings,
  PaymentResult
}

export {
  TapOn as default,
  SetupError,
  RefundError,
  PaymentTypes,
  PaymentError,
  InstallmentTypes
}

