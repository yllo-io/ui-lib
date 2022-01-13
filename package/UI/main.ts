export let themeType: EThemeType

export const setTheme = (newThemeType: EThemeType): void => {
    type Variable = {
        key: string
        value: string
    }

    const themeVariablesLight: Variable[] = [
        { key: '--contrast-1', value: '#0ea580' },
        { key: '--contrast-2', value: '#cd5654' },
        { key: '--contrast-3', value: '#2168ef' },
        { key: '--contrast-4', value: '#f1c636' },
        { key: '--contrast-6', value: '#00cb99' },
        { key: '--line-1', value: '#f6f6f6' },
        { key: '--line-2', value: '#e7e7e7' },
        { key: '--line-3', value: '#d6d6d6' },
        { key: '--line-4', value: '#989898' },
        { key: '--line-5', value: '#707070' },
        { key: '--line-6', value: '#343434' },
        { key: '--line-7', value: '#161616' },
    ]

    const themeVariablesDark: Variable[] = [
        { key: '--contrast-1', value: '#2CFFCC' },
        { key: '--contrast-2', value: '#FF7472' },
        { key: '--contrast-3', value: '#58AFFF' },
        { key: '--contrast-4', value: '#FFE079' },
        { key: '--contrast-6', value: '#2CFFCC' },
        { key: '--line-1', value: '#161616' },
        { key: '--line-2', value: '#343434' },
        { key: '--line-3', value: '#707070' },
        { key: '--line-4', value: '#989898' },
        { key: '--line-5', value: '#d6d6d6' },
        { key: '--line-6', value: '#e7e7e7' },
        { key: '--line-7', value: '#f6f6f6' },
    ]

    if (newThemeType === EThemeType.light) {
        setRootVariables(themeVariablesLight)
        themeType = EThemeType.light
    } else if (newThemeType === EThemeType.dark) {
        setRootVariables(themeVariablesDark)
        themeType = EThemeType.dark
    }

    function setRootVariables(variables: Variable[]) {
        variables.forEach((variable) => {
            document.documentElement.style.setProperty(variable.key, variable.value)
        })
    }
}

export enum EThemeType {
    light,
    dark,
}

export const actions = {
    setTheme,
}
