<script lang="ts">
    import Test from '../Test/Test.svelte'

    import { Paper } from '@yllo/ui-lib'
    import { Button, EButtonVariant } from '@yllo/ui-lib'
    import { Switcher } from '@yllo/ui-lib'
    import { Loader } from '@yllo/ui-lib'
    import { Checkbox } from '@yllo/ui-lib'
    import { Input } from '@yllo/ui-lib'
    import { Avatar, EAvatarShape } from '@yllo/ui-lib'
    import { Tooltip, ETooltipPosition } from '@yllo/ui-lib'
    import ui, { EThemeType } from '@yllo/ui-lib'

    import ChangeThemeButton from '../ChangeThemeButton/ChangeThemeButton.svelte'

    let themeType: EThemeType = EThemeType.dark
    ui.setTheme(EThemeType.dark)

    let switcherState: boolean = false
    $: console.log('reisActive switcherState', switcherState)
    let checkboxState: boolean = true
    $: console.log('reisActive checkboxState', checkboxState)
    let inputValue: string = ''
    $: console.log('reisActive inputValue', inputValue)
</script>

<ChangeThemeButton bind:themeType style="position: absolute; top: 20px; right: 20px;" />
<div class="wrapper">
    <!-- <Test /> -->
    <Paper isPadding isCenter>
        <div class="h1 font_math">Hello world!</div>
    </Paper>
    <div class="paper padding">I am div with "paper" class</div>
    <Paper isCenter isPadding isRounded={false} isShadow={false}>
        <Button on:click={() => alert('Hello world!')} isActive={true} isRounded={true} variant={EButtonVariant.outlined} isMarginHorizontal>Click me</Button>
        <Button isRounded={false} isActive={true} variant={EButtonVariant.outlined2} isMarginHorizontal>I am Button</Button>
        <Button isRounded={true} isActive={true} variant={EButtonVariant.filled} isMarginHorizontal>I am Button</Button>
        <Button isRounded={false} isActive={true} variant={EButtonVariant.text} isMarginHorizontal>I am Button</Button>
        <Button isRounded={false} isActive={true} variant={EButtonVariant.text2} isMarginHorizontal>I am Button</Button>
    </Paper>
    <Paper isCenter isPadding isRounded={true} isShadow={false}>
        <Button isRounded={false} isActive={false} isStretched>I am Button</Button>
    </Paper>
    <Paper isCenter isPadding>
        <Switcher bind:state={switcherState} isActive={true} on:change={(e) => console.log('switcher on change, state:', e.detail)} />
        <Switcher state={true} isActive={false} />
    </Paper>
    <Paper isCenter isPadding>
        <Loader />
        <Loader isContrast />
    </Paper>
    <Paper isCenter isPadding>
        <Checkbox bind:state={checkboxState} isActive={true} on:change={(e) => console.log('checkbox on change, state:', e.detail)} />
        <Checkbox state={true} isActive={false} isOutlined />
    </Paper>
    <Paper isCenter isPadding>
        <Input placeholder="ph text" label="label text" bind:value={inputValue} isRounded={false} />
        <Input placeholder="ph text" label="label text" isActive={false} value="Value" />
    </Paper>
    <Paper isCenter isPadding>
        <Input placeholder="ph text" label="label text" isActive={true} value="Value" incorrect="Incorrect Value" isStretched />
    </Paper>
    <Paper isCenter isPadding>
        <Input placeholder="ph text" label="label text" isActive={true} value="Value" rightLabel="LABEL" isStretched />
    </Paper>
    <Paper isCenter isPadding>
        <Input placeholder="password" label="label text" isActive={true} value="" isPassword isStretched />
    </Paper>
    <Paper isCenter isPadding>
        <Avatar variant={EAvatarShape.circle} size={1} symbol="A" isOnline />
        <Avatar variant={EAvatarShape.squircle} size={4} symbol="B" isOnline />
    </Paper>
    <Paper isCenter isPadding isRounded={false} isShadow={false}>
        <Tooltip text="I am bottom tooltip" position={ETooltipPosition.bottom} style="margin: 0 10px;">
            <Button on:click={() => alert('Hello world!')} isActive={true} isRounded={true} variant={EButtonVariant.outlined}>I have tooltip</Button>
        </Tooltip>
        <Tooltip text="I am right tooltip" position={ETooltipPosition.right} style="margin: 0 10px;">
            <Button on:click={() => alert('Hello world!')} isActive={true} isRounded={true} variant={EButtonVariant.outlined}>I also have tooltip</Button>
        </Tooltip>
    </Paper>
</div>

<style>
    .wrapper {
        width: 100%;
        min-height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background-color: var(--line-1);
    }
    .wrapper > :global(*) {
        margin: 30px 0;
    }
</style>
