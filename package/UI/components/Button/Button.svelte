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
    import { _theme } from '../../theme'

    export let variant: EButtonVariant = EButtonVariant.outlined
    export let isRounded: boolean
    export let isStretched: boolean = false
    export let isActive: boolean = true
    export let isMarginHorizontal: boolean = false
    export let isMarginVertical: boolean = false
    export let isHoverPointer: boolean = false
    export let minWidth: string | false = false

    const dispatch = createEventDispatcher()
</script>

<div
    on:click={(event) => {
        if (isActive) dispatch('click', event)
    }}
    class="button button_variant_{variant} noselect"
    style={minWidth ? 'min-width: ' + minWidth : ''}
    class:stretched={isStretched}
    class:rounded={isRounded === undefined ? $_theme.isRounded : isRounded}
    class:disabled={!isActive}
    class:margin_horizontal={isMarginHorizontal}
    class:margin_vertical={isMarginVertical}
    class:hover_pointer={isHoverPointer}
>
    <slot />
</div>
