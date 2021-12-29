<script lang="ts" context="module">
    export enum EButton {
        outlined,
        outlined2,
        filled,
        text,
        text2,
    }
</script>

<script lang="ts">
    import { createEventDispatcher } from 'svelte'

    export let variant: EButton = EButton.outlined
    export let rounded: boolean = true
    export let stretched: boolean = false
    export let active: boolean = true
    export let marginHorizontal: boolean = false
    export let marginVertical: boolean = false

    const dispatch = createEventDispatcher()
</script>

<div
    on:click={(event) => {
        if (active) dispatch('click', event)
    }}
    class="button button_variant_{variant} noselect"
    class:stretched
    class:rounded
    class:disabled={!active}
    class:margin_horizontal={marginHorizontal}
    class:margin_vertical={marginVertical}
>
    <slot />
</div>
