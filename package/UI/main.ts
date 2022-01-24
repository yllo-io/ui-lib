import { get } from 'svelte/store'
import { ThemeOptions, EThemeType } from './types'
import { _theme } from './theme'

export const setThemeOptions = (newThemeOptions: ThemeOptions): void => {
    // console.log('setThemeOptions', newThemeOptions)
    const theme = get(_theme)
    if (theme.themeType !== newThemeOptions.themeType) {
        if (newThemeOptions.themeType === EThemeType.light) setRootVariables(themeVariablesLight)
        else if (newThemeOptions.themeType === EThemeType.dark) setRootVariables(themeVariablesDark)
    }

    _theme.set(newThemeOptions)

    function setRootVariables(variables: Variable[]) {
        variables.forEach((variable) => {
            document.documentElement.style.setProperty(variable.key, variable.value)
        })
    }
}

export const actions = {
    setThemeOptions,
}

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

    { key: '--line-1-rgb', value: '246, 246, 246' },
    { key: '--line-2-rgb', value: '231, 231, 231' },
    { key: '--line-3-rgb', value: '214, 214, 214' },
    { key: '--line-4-rgb', value: '152, 152, 152' },
    { key: '--line-5-rgb', value: '112, 112, 112' },
    { key: '--line-6-rgb', value: '52, 52, 52' },
    { key: '--line-7-rgb', value: '22, 22, 22' },

    { key: '--shadow', value: '0px 4px 28px rgba(0, 0, 0, 0.11)' },
    { key: '--shadow-strong', value: '0px 4px 30px rgba(0, 0, 0, 0.22)' },
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

    { key: '--line-1-rgb', value: '22, 22, 22' },
    { key: '--line-2-rgb', value: '52, 52, 52' },
    { key: '--line-3-rgb', value: '112, 112, 112' },
    { key: '--line-4-rgb', value: '152, 152, 152' },
    { key: '--line-5-rgb', value: '214, 214, 214' },
    { key: '--line-6-rgb', value: '231, 231, 231' },
    { key: '--line-7-rgb', value: '246, 246, 246' },

    { key: '--shadow', value: '0px 8px 51px rgba(0, 0, 0, 0.46)' },
    { key: '--shadow-strong', value: '0px 8px 72px rgba(0, 0, 0, 0.84)' },
]
