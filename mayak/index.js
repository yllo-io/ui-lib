import { actions } from './UI/main.ts'
export { ThemeOptions, EThemeType } from './UI/types.ts'
export { default as Paper } from './UI/components/Paper/Paper.svelte'
export { default as Button } from './UI/components/Button/Button.svelte'
export { EButtonVariant as EButtonVariant } from './UI/components/Button/Button.svelte'
export { default as Switcher } from './UI/components/Switcher/Switcher.svelte'
export { default as Loader } from './UI/components/Loader/Loader.svelte'
export { default as Checkbox } from './UI/components/Checkbox/Checkbox.svelte'
export { default as Input } from './UI/components/Input/Input.svelte'
export { default as Avatar } from './UI/components/Avatar/Avatar.svelte'
export { EAvatarShape as EAvatarShape } from './UI/components/Avatar/Avatar.svelte'
export { default as Tooltip } from './UI/components/Tooltip/Tooltip.svelte'
export { ETooltipPosition as ETooltipPosition } from './UI/components/Tooltip/Tooltip.svelte'
export { default as Tabs } from './UI/components/Tabs/Tabs.svelte'
export { setCursor } from './UI/components/Cursor/cursor'
export { interactiveElement } from './UI/components/Cursor/interactiveCursor'
export default actions
