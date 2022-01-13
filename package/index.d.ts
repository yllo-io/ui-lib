import { SvelteComponent } from 'svelte'
import { EThemeType } from './UI/main.ts'
import { EButtonVariant } from './UI/components/Button/Button.svelte'
import { EAvatarShape } from './UI/components/Avatar/Avatar.svelte'
import { ETooltipPosition } from './UI/components/Tooltip/Tooltip.svelte'

export { EThemeType }
export declare function setTheme(theme: EThemeType): void
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
