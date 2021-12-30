<script lang="ts">
    import Test from '../Test/Test.svelte'

    import { Paper } from '@yllo/ui-lib'
    import { Button } from '@yllo/ui-lib'
    import { EButton } from '@yllo/ui-lib'
    import { Switcher } from '@yllo/ui-lib'
    import { Loader } from '@yllo/ui-lib'

    let switcherState: boolean = false
    $: console.log('switcherState change', switcherState)
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
        <Switcher state={switcherState} active={true} on:change={(e) => (switcherState = e.detail)} />
        <Switcher state={true} active={false} />
    </Paper>
    <Paper>
        <Loader />
        <Loader contrast />
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
