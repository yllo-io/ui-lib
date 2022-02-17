export type ThemeOptions = {
    themeType: EThemeType
    isRounded: boolean
    isShadow: boolean
    isBorder: boolean
    isInteractiveCursor: boolean
}

export enum EThemeType {
    light,
    dark,
}
