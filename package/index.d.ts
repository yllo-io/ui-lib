import { SvelteComponent } from 'svelte'
import { ThemeOptions, EThemeType } from './UI/types.ts'
import { EButtonVariant } from './UI/components/Button/Button.svelte'
import { EAvatarShape } from './UI/components/Avatar/Avatar.svelte'
import { ETooltipPosition } from './UI/components/Tooltip/Tooltip.svelte'
import { interactiveElement } from './UI/components/Cursor/interactiveCursor'

export { ThemeOptions, EThemeType }
export declare function setThemeOptions(newThemeOptions: ThemeOptions): void
export declare const Paper: typeof SvelteComponent
export { EButtonVariant }
export declare const Button: typeof SvelteComponent
export declare const Switcher: typeof SvelteComponent
export declare const Loader: typeof SvelteComponent
export declare const Checkbox: typeof SvelteComponent
export declare const Input: typeof SvelteComponent
export { EAvatarShape }
export declare const Avatar: typeof SvelteComponent
export { ETooltipPosition }
export declare const Tooltip: typeof SvelteComponent
export declare const Tabs: typeof SvelteComponent
export declare function setCursor(newCursor: string): void
export declare function interactiveElement(
    node: HTMLElement,
    { isActive, onClick = undefined, isCursorHover = true }: { isActive: boolean; onClick?: (event: MouseEvent) => void; isCursorHover?: boolean }
)
