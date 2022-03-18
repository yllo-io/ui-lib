<script lang="ts">
    import { createEventDispatcher } from 'svelte'

    export let state: boolean
    export let isActive: boolean = true
    export let isOutlined: boolean = false

    const dispatch = createEventDispatcher()
</script>

<div
    class="checkbox"
    class:outlined={isOutlined}
    class:disabled={!isActive}
    class:checked={state}
    on:click={() => {
        if (isActive) {
            state = !state
            dispatch('change', state)
        }
    }}
>
    {#if state}
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1.5 6.5L6.58824 11L14.5 1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
    {/if}
</div>
