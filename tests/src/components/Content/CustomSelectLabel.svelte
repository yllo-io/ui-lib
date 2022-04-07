<script lang="ts">
    export let selectedItems
    export let isOpen: boolean
</script>

<div class="my-label rounded_light" class:isOpen on:click>
    <div class="my-label__value color_line6 noselect">{@html selectedItems[0].value}</div>
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="svg-arrow svelte-qu6obu"
        ><path d="M3.33337 6L8.00004 10L12.6667 6" stroke="#BABABA" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg
    >
</div>

<style>
    .my-label {
        height: 32px;
        border: 1px solid var(--contrast-2);
        box-sizing: border-box;
        border-radius: 4px;
        padding-left: 20px;
        padding-right: 10px;
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
    .my-label.isOpen {
        border: 1px solid var(--contrast-3);
    }
    .my-label__value {
        margin-right: 20px;
    }
</style>
