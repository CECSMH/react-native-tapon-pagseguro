# react-native-tapon-pagseguro

**React Native** library to integrate **PagBank / PagSeguro Tap On** (NFC Tap-to-Pay) using the official Android extension.

Accept contactless payments (credit, debit and installment) directly on Android devices that support NFC + the PagBank Tap On extension.
[![npm version](https://badge.fury.io/js/react-native-tapon-pagseguro.svg)](https://badge.fury.io/js/react-native-tapon-pagseguro) 
[![Platform](https://img.shields.io/badge/platform-Android-yellow.svg)](https://www.android.com)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Features

- Initialize Tap On service with app credentials
- Customizable theme (colors for toolbar, buttons, status bar…)
- Check NFC support, NFC enabled status & extension compatibility
- Redirect user to install Tap On extension from Play Store
- Perform **contactless payments** (credit/debit/installments)
- Request full or partial **refunds** (estornos)

**Currently supported only on Android** (via `react-native-nitro-modules`)

## Installation

```bash
npm install react-native-tapon-pagseguro react-native-nitro-modules
# or
yarn add react-native-tapon-pagseguro react-native-nitro-modules
```

## Quick Start

```typescript
import TapOn, { SetupError, PaymentError } from 'react-native-tapon-pagseguro';

// 1. Initialize (call once – ideally in App.tsx or splash)
TapOn.initialize({
  app_key:    "your_app_key_from_pagbank",
  app_name:   "Your App Name",
  app_version:"1.2.3",
  // optional theme
  theme: {
    toolbar_color: "#1E40AF",
    button_background_color: "#3B82F6",
    button_text_color: "#FFFFFF",
  }
});

// 2. Check if device & extension are ready
if (!TapOn.is_nfc_supported()) {
  alert("Device does not support NFC payments.");
  return;
}

if (!TapOn.is_nfc_enabled()) {
  alert("Please enable NFC in device settings.");
  return;
}

if (!TapOn.is_extension_available()) {
  // Redirect user to install extension
  TapOn.get_extension_on_playstore();
  return;
}

// 3. Perform a payment (amount in cents)
try {
  const result = await TapOn.request_payment(15000); // R$ 150,00

  console.log({
    transaction_code: result.transaction_code,
    card_brand:       result.card_brand,
    installments:     result.installments,
    payment_method:   result.payment_method, // 0=credit, 1=debit, 2=installment
  });
} catch (e) {
  if (e instanceof PaymentError) {
    console.error(`Payment failed [${e.code}]: ${e.message}`);
  } else if (e instanceof SetupError) {
    console.error(`Configuration error: ${e.message}`);
  } else {
    console.error(e);
  }
}
```

## API Reference

### Static Methods

| Method                              | Description                                                                 | Returns                          | Throws               |
|:------------------------------------|:----------------------------------------------------------------------------|:---------------------------------|:---------------------|
| `initialize(data: SettingData)`     | Initialize service (call **once**)                                          | `void`                           | `SetupError`         |
| `set_theme(data: ThemeSettings)`    | Change visual theme after initialization                                    | `void`                           | `SetupError`         |
| `is_nfc_supported()`                | Device has NFC hardware                                                     | `boolean`                        | —                    |
| `is_nfc_enabled()`                  | NFC is turned on in system settings                                         | `boolean`                        | —                    |
| `is_extension_supported()`          | Device hardware is compatible with Tap On                                   | `boolean`                        | —                    |
| `is_extension_available()`          | Tap On extension is installed                                               | `boolean`                        | —                    |
| `get_extension_on_playstore()`      | Open Play Store page of Tap On extension                                    | `void`                           | —                    |
| `request_payment(amount: number)`   | Start contactless payment (amount in **cents**)                             | `Promise<PaymentResult>`         | `PaymentError`, `SetupError` |
| `request_refund(transaction_code, amount)` | Refund (full or partial)                                             | `Promise<boolean>`               | `RefundError`, `SetupError` |

### Types

```ts
type SettingData = {
  app_key:    string;
  app_name:   string;
  app_version:string;
  theme?:     ThemeSettings;
};

type ThemeSettings = {
  toolbar_color?:           string;   // #RRGGBB or #RRGGBBAA
  toolbar_text_color?:      string;
  status_bar_color?:        string;
  button_background_color?: string;
  button_text_color?:       string;
};

type PaymentResult = {
  amount:                 number;           // in cents
  raw_amount:             number;
  payment_method:         PaymentTypes;     // 0=credit, 1=debit, 2=installment
  transaction_code:       string;
  transaction_date_time:  string;
  card_holder:            string;
  card_brand:             string;
  installments:           number;
  installment_value:      number;           // in cents
  raw_installment_value:  number;
  installment_method:     InstallmentTypes; // who absorbs the installment cost
};

enum PaymentTypes {
  CREDIT            = 0,
  DEBIT             = 1,
  INSTALLMENT_CREDIT= 2,
}

enum InstallmentTypes {
  NO_INSTALLMENT    = 0,
  SELLER_INSTALLMENT= 1,
  BUYER_INSTALLMENT = 2,
}
```
## Requirements

- **Android** only (iOS not supported yet)
- `react-native-nitro-modules` ≥ 0.32.0
- Android minSdk 24+ (usually already satisfied)
- PagBank Tap On extension installed on the device
- Valid PagBank **app_key** (contact PagBank integration team)

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/your-feature`).
3. Commit your changes (`git commit -m 'Add your feature'`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a pull request.

## Support the Project ☕

If you've found this library helpful, consider buying me a coffee!



Scan the QR code to donate (PIX):

![PIX donation QR code](https://api.qrserver.com/v1/create-qr-code/?data=00020126580014BR.GOV.BCB.PIX013698817f09-40db-47c0-adf3-0c69b99ef1635204000053039865802BR5924Carlos%20Eduardo%20Conceicao6009SAO%20PAULO62140510rmQmKYzFZ863046800)

Thank you for your support! 🚀

## License

MIT License. See LICENSE for details.
