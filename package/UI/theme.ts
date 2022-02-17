import { writable } from 'svelte/store'
import { ThemeOptions, EThemeType } from './types'

function createStore() {
    const { subscribe, update, set } = writable(<ThemeOptions>{
        themeType: EThemeType.dark,
        isRounded: false,
        isShadow: true,
        isBorder: true,
        isInteractiveCursor: true,
    })
    return {
        subscribe,
        set,
    }
}

export const _theme = createStore()
