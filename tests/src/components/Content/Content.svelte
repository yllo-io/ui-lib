<script lang="ts">
    import { Something } from '@yllo/ui-lib'
    import { ESomething } from '@yllo/ui-lib'
    import { onMount } from 'svelte'
    import Test from '../Test/Test.svelte'
</script>

<div class="wrapper">
    <Something value1={ESomething.prop2} />
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
