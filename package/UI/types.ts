export type ThemeOptions = {
    themeType: EThemeType
    isRounded: boolean
    isShadow: boolean
    isBorder: boolean
}

export enum EThemeType {
    light,
    dark,
}