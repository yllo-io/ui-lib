<script lang="ts" context="module">
    export enum ETooltipPosition {
        bottom,
        right,
    }
</script>

<script lang="ts">
    export let text: string = ''
    export let position: ETooltipPosition = ETooltipPosition.bottom
    export let style: string = ''
    export let classes: string = ''
</script>

<div class="tooltip-wrapper {classes}" {style}>
    <slot />
    <div class="tooltip tooltip_position_{position} body4 font_math">{text}</div>
</div>
