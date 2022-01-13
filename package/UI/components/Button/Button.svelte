<script lang="ts" context="module">
    export enum EButtonVariant {
        outlined,
        outlined2,
        filled,
        text,
        text2,
    }
</script>

<script lang="ts">
    import { createEventDispatcher } from 'svelte'

    export let variant: EButtonVariant = EButtonVariant.outlined
    export let isRounded: boolean = true
    export let isStretched: boolean = false
    export let isActive: boolean = true
    export let isMarginHorizontal: boolean = false
    export let isMarginVertical: boolean = false
    export let isHoverPointer: boolean = false

    const dispatch = createEventDispatcher()
</script>

<div
    on:click={(event) => {
        if (isActive) dispatch('click', event)
    }}
    class="button button_variant_{variant} noselect"
    class:stretched={isStretched}
    class:rounded={isRounded}
    class:disabled={!isActive}
    class:margin_horizontal={isMarginHorizontal}
    class:margin_vertical={isMarginVertical}
    class:hover_pointer={isHoverPointer}
>
    <slot />
</div>
