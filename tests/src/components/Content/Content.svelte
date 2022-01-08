<script lang="ts">
    import Test from '../Test/Test.svelte'

    import { Paper } from '@yllo/ui-lib'
    import { Button, EButton } from '@yllo/ui-lib'
    import { Switcher } from '@yllo/ui-lib'
    import { Loader } from '@yllo/ui-lib'
    import { Checkbox } from '@yllo/ui-lib'
    import { Input } from '@yllo/ui-lib'
    import { Avatar, EAvatar } from '@yllo/ui-lib'
    import { Tooltip, ETooltip } from '@yllo/ui-lib'

    let switcherState: boolean = false
    $: console.log('reactive switcherState', switcherState)
    let checkboxState: boolean = true
    $: console.log('reactive checkboxState', checkboxState)
    let inputValue: string = ''
    $: console.log('reactive inputValue', inputValue)
</script>

<div class="wrapper">
    <!-- <Test /> -->
    <div class="paper">I am div with "paper" class</div>
    <Paper rounded={false} shadow={false}>
        <Button on:click={() => alert('Hello world!')} active={true} rounded={true} variant={EButton.outlined} marginHorizontal>Click me</Button>
        <Button rounded={false} active={true} variant={EButton.outlined2} marginHorizontal>I am Button</Button>
        <Button rounded={true} active={true} variant={EButton.filled} marginHorizontal>I am Button</Button>
        <Button rounded={false} active={true} variant={EButton.text} marginHorizontal>I am Button</Button>
        <Button rounded={false} active={true} variant={EButton.text2} marginHorizontal>I am Button</Button>
    </Paper>
    <Paper rounded={true} shadow={false}>
        <Button rounded={false} active={false} stretched>I am Button</Button>
    </Paper>
    <Paper>
        <Switcher bind:state={switcherState} active={true} on:change={(e) => console.log('switcher on change, state:', e.detail)} />
        <Switcher state={true} active={false} />
    </Paper>
    <Paper>
        <Loader />
        <Loader contrast />
    </Paper>
    <Paper>
        <Checkbox bind:state={checkboxState} active={true} on:change={(e) => console.log('checkbox on change, state:', e.detail)} />
        <Checkbox state={true} active={false} outlined />
    </Paper>
    <Paper>
        <Input placeholder="ph text" label="label text" bind:value={inputValue} rounded={false} />
        <Input placeholder="ph text" label="label text" active={false} value="Value" />
    </Paper>
    <Paper>
        <Input placeholder="ph text" label="label text" active={true} value="Value" incorrect="Incorrect Value" stretched />
    </Paper>
    <Paper>
        <Input placeholder="ph text" label="label text" active={true} value="Value" rightLabel="LABEL" stretched />
    </Paper>
    <Paper>
        <Input placeholder="password" label="label text" active={true} value="" password stretched />
    </Paper>
    <Paper>
        <Avatar variant={EAvatar.circle} size={4} symbol="A" online />
    </Paper>
    <Paper rounded={false} shadow={false}>
        <Tooltip text="I am bottom tooltip" position={ETooltip.bottom} style="margin: 0 10px;">
            <Button on:click={() => alert('Hello world!')} active={true} rounded={true} variant={EButton.outlined}>I have tooltip</Button>
        </Tooltip>
        <Tooltip text="I am right tooltip" position={ETooltip.right} style="margin: 0 10px;">
            <Button on:click={() => alert('Hello world!')} active={true} rounded={true} variant={EButton.outlined}>I also have tooltip</Button>
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
