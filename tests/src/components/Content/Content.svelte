<script lang="ts">
    import { Something } from '@yllo/ui-lib'
    // import { Something } from '@yllo/ui-lib'
    // import Something from '@yllo/ui-lib/UI/components/Something/Something.svelte'
    import { onMount } from 'svelte'
    import Test from '../Test/Test.svelte'
    // import Something from '../Something/Something.svelte'
    onMount(() => {
        // console.log(a)
    })
    let a = Something
</script>

<div class="wrapper">
    <!-- <Something /> -->
    <svelte:component this={a} />
    <Test />
</div>

<style>
    .wrapper {
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        background-color: var(--contrast-1);
        color: rgb(255, 0, 0);
    }
</style>
