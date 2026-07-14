import type { ThemeSettings } from "./theme"


export type SettingData = {
    app_key: string,
    app_name: string,
    app_version: string,
    enable_taxpass_through?: boolean,
    theme?: ThemeSettings
}