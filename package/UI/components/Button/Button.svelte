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
    import { interactiveElement } from '../Cursor/interactiveCursor'

    export let variant: EButtonVariant = EButtonVariant.outlined
    export let isRounded: boolean
    export let isStretched: boolean = false
    export let isActive: boolean = true
    export let isMarginHorizontal: boolean = false
    export let isMarginVertical: boolean = false
    export let isHoverPointer: boolean = false
    export let minWidth: string | false = false
    export let classes: string = ''
    export let isClickAnimation: boolean = true

    const dispatch = createEventDispatcher()

    let clickAnimation: boolean = false
    let animationTimeout: NodeJS.Timer
</script>

<div
    on:click={(event) => {
        if (isActive) {
            if (isClickAnimation) {
                clickAnimation = true
                clearTimeout(animationTimeout)
                animationTimeout = setTimeout(() => {
                    clickAnimation = false
                    dispatch('click', event)
                }, 200)
            } else {
                dispatch('click', event)
            }
        }
    }}
    use:interactiveElement={{ isActive: $_theme.isInteractiveCursor && isActive }}
    class="button button_variant_{variant} noselect {classes}"
    style={minWidth ? 'min-width: ' + minWidth : ''}
    class:stretched={isStretched}
    class:button_rounded={isRounded === undefined ? $_theme.isRounded : isRounded}
    class:disabled={!isActive}
    class:margin_horizontal={isMarginHorizontal}
    class:margin_vertical={isMarginVertical}
    class:hover_pointer={isHoverPointer}
    class:click-animation={clickAnimation}
>
    <slot />
</div>
