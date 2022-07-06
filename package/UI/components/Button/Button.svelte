<script lang="ts">
    import { createEventDispatcher } from 'svelte'
    import { _theme } from '../../theme'
    import { interactiveElement } from '../Cursor/interactiveCursor'
    import { EButtonVariant } from './button'
    import { _client } from '../../tools/client'
    import { EColor } from '../../types'

    export let variant: EButtonVariant = EButtonVariant.outlined
    export let isRounded: boolean | undefined = undefined
    export let isStretched: boolean = false
    export let isActive: boolean = true
    export let isMarginHorizontal: boolean = false
    export let isMarginVertical: boolean = false
    export let isHoverPointer: boolean = false
    export let minWidth: string | false = false
    export let classes: string = ''
    export let isClickAnimation: boolean = true
    export let isAnimationDelay: boolean = true
    export let backgroundColor: EColor = EColor.contrast3
    export let color: EColor = EColor.line1

    const dispatch = createEventDispatcher()

    let clickAnimation: boolean = false
    let animationTimeout: ReturnType<typeof setTimeout>
</script>

<div
    on:click={(event) => {
        if (isActive) {
            if (isClickAnimation) {
                clickAnimation = true
                if (!isAnimationDelay) dispatch('click', event)
                clearTimeout(animationTimeout)
                animationTimeout = setTimeout(() => {
                    clickAnimation = false
                    if (isAnimationDelay) dispatch('click', event)
                }, 200)
            } else {
                dispatch('click', event)
            }
        }
    }}
    use:interactiveElement={{ isActive: !$_client.isMobile && $_theme.isInteractiveCursor && isActive }}
    class="button button_variant_{variant} {variant === EButtonVariant.filled ? 'background-color_' + backgroundColor : ''} color_{color} noselect {classes}"
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
