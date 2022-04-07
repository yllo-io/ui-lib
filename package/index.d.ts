import { SvelteComponent } from 'svelte'
import { ThemeOptions, EThemeType } from './UI/types.ts'
import { interactiveElement } from './UI/components/Cursor/interactiveCursor'

export { ThemeOptions, EThemeType }
export declare function setThemeOptions(newThemeOptions: ThemeOptions): void

import PaperComponent from './UI/components/Paper/Paper.svelte'
export declare const Paper: typeof PaperComponent

import ButtonComponent from './UI/components/Button/Button.svelte'
export declare const Button: typeof ButtonComponent
import { EButtonVariant } from './UI/components/Button/Button.svelte'
export { EButtonVariant }

import SwitcherComponent from './UI/components/Switcher/Switcher.svelte'
export declare const Switcher: typeof SwitcherComponent

import LoaderComponent from './UI/components/Loader/Loader.svelte'
export declare const Loader: typeof LoaderComponent

import CheckboxComponent from './UI/components/Checkbox/Checkbox.svelte'
export declare const Checkbox: typeof CheckboxComponent

import InputComponent from './UI/components/Input/Input.svelte'
export declare const Input: typeof InputComponent

import AvatarComponent from './UI/components/Avatar/Avatar.svelte'
export declare const Avatar: typeof AvatarComponent
import { EAvatarShape } from './UI/components/Avatar/Avatar.svelte'
export { EAvatarShape }

import TooltipComponent from './UI/components/Tooltip/Tooltip.svelte'
export declare const Tooltip: typeof TooltipComponent
import { ETooltipPosition } from './UI/components/Tooltip/Tooltip.svelte'
export { ETooltipPosition }

import TabsComponent from './UI/components/Tabs/Tabs.svelte'
export declare const Tabs: typeof TabsComponent

import SelectComponent from './UI/components/Select/Select.svelte'
export declare const Select: typeof SelectComponent
import { SelectValueT } from './UI/components/Select/Select.svelte'
export { SelectValueT }

import ScrollbarComponent from './UI/components/Scrollbar/Scrollbar.svelte'
export declare const Scrollbar: typeof ScrollbarComponent

export declare function setCursor(newCursor: string): void
export declare function interactiveElement(
    node: HTMLElement,
    { isActive, onClick = undefined, isCursorHover = true }: { isActive: boolean; onClick?: (event: MouseEvent) => void; isCursorHover?: boolean }
)
