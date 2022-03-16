export type ThemeOptions = {
    themeType: EThemeType
    isRounded: boolean
    isShadow: boolean
    isBorder: boolean
    isInteractiveCursor: boolean
    isCircleCursor: boolean
}

export enum EThemeType {
    light,
    dark,
}

export enum EColor {
    line1 = 'line1',
    line2 = 'line2',
    line3 = 'line3',
    line4 = 'line4',
    line5 = 'line5',
    line6 = 'line6',
    line7 = 'line7',
    contrast1 = 'contrast1',
    contrast2 = 'contrast2',
    contrast3 = 'contrast3',
    contrast4 = 'contrast4',
    contrast6 = 'contrast6',
}
