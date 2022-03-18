import { writable } from 'svelte/store'
import { EThemeType } from './types'
import type { ThemeOptions } from './types'

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
