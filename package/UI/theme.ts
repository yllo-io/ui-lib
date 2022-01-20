import { writable } from 'svelte/store'
import { ThemeOptions, EThemeType } from './types'

function createStore() {
    const { subscribe, update, set } = writable(<ThemeOptions>{
        themeType: EThemeType.light,
        isRounded: false,
        isShadow: false,
        isBorder: true,
    })
    return {
        subscribe,
        set
    }
}

export const _theme = createStore()
