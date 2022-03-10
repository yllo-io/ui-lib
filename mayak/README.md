# Mayak UI-lib
[yllo](https://yllo.co)

## Svelte UI Lib

### Installation

1. Install npm package

```
npm i @yllo/ui-lib
```

2. Add scss classes

```
<style lang="scss" global>
    @import '../node_modules/@yllo/ui-lib/UI/theme.scss';
    @import '../node_modules/@yllo/ui-lib/UI/lib.scss';
</style>
```

3. Set css root variables for fonts and avatar mask

```
--avatar-mask
--font-Semibold
--font-Regular
--font-Math
```

## Actions
```
import ui, { EThemeType } from '@yllo/ui-lib'
let themeType: EThemeType = EThemeType.dark
ui.setTheme(EThemeType.dark)
```

## Components

 - [typography](#typography)
 - [root variables](#root-variables)
 - [avatar](#avatar)
 - [button](#button)
 - [checkbox](#checkbox)
 - [input](#input)
 - [loader](#loader)
 - [paper](#paper)
 - [switcher](#switcher)
 - [paper](#paper)
 - [other classes](#other-classes)

\* - required

### Typography
#### Classes

 - **Headlines:** .h1, .h2, .h3, .h4
 - **Subtitles:** .st1, .st2
 - **Body text:** .body1, .body2, .body3, .body4
 - **Terminal font:** .font_math

#### Positioning
.text-align_left, .text-align_center, .text-align_right

### Root variables

Relevant to the theme

 - --contrast-[1-6]
 - --line-[1-7]

### Avatar
```
<Avatar variant={EAvatarShape.circle} size={1} symbol="A" background="linear-gradient(180deg, #F2793D 0%, #F89E39 100%)" isOnline />
```
**Props:**

 - background: string
 - symbol: string | false
 - size: number [1-4]
 - variant: EAvatarShape [circle, squircle]
 - isOnline: boolean

### Button
```
<Button on:click={() => alert('Hello world!')} isActive={true} isRounded={true} variant={EButtonVariant.outlined} isMarginHorizontal>Click me</Button>
```
**Props:**

 - variant: EButtonVariant [outlined, outlined2, filled, text, text2]
 - isActive: boolean
 - isRounded: boolean
 - isStretched: boolean
 - isMarginHorizontal: boolean
 - isMarginVertical: boolean
 - isHoverPointer: boolean

### Checkbox
```
<Checkbox bind:state={checkboxState} isActive={true} on:change={(e) => console.log('checkbox on change, state:', e.detail)} />
```
**Props:**

 - state: boolean \*
 - isActive: boolean
 - isOutlined: boolean

### Input
```
<Input placeholder="ph text" label="label text" bind:value={inputValue} isRounded={false} />
```
**Props:**

 - value: string \*
 - label: string | false
 - placeholder: string
 - isActive: boolean
 - incorrect: string | false
 - isStretched: boolean
 - isRounded: boolean
 - rightLabel: string | false
 - isPassword: boolean

### Loader
```
<Loader isContrast />
```
**Props:**

 - isContrast: boolean

### Paper
```
<Paper isCenter isPadding isRounded={false} isShadow={false}>
	// some content
</Paper>

// or as a DOM element

<div class="paper padding">I am div with "paper" class</div>
```
**Props:**

 - isRounded: boolean
 - isShadow: boolean
 - isShadowStrong: boolean
 - isColumn: boolean
 - isPadding: boolean
 - isCenter: boolean
 - isBackground: boolean

### Switcher
```
<Switcher bind:state={switcherState} isActive={true} on:change={(e) => console.log('switcher on change, state:', e.detail)} />
```
**Props:**

 - state: boolean \*
 - isActive: boolean

### Tooltip
```
<Tooltip text="I am bottom tooltip" position={ETooltipPosition.bottom} style="margin: 0 10px;">
	<Button on:click={() => alert('Hello world!')} isActive={true} isRounded={true} variant={EButtonVariant.outlined}>I have tooltip</Button>
</Tooltip>
```
**Props:**

 - text: string
 - position: ETooltipPosition [bottom, right]
 - style: string
 - classes: string

### Other classes

.noselect, .rounded, .rounded_light, .shadow, .shadow_strong, .hover_pointer