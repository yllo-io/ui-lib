<script lang="ts" context="module">
    export enum ETooltipPosition {
        bottom,
        right,
    }
</script>

<script lang="ts">
    import { _theme } from '../../theme'

    export let text: string = ''
    export let position: ETooltipPosition = ETooltipPosition.bottom
    export let style: string = ''
    export let classes: string = ''
    export let isBorder: boolean
</script>

<div class="tooltip-wrapper {classes}" {style} class:border={isBorder === undefined ? $_theme.isBorder : isBorder}>
    <slot />
    <div class="tooltip tooltip_position_{position} body4 font_math">{text}</div>
</div>
