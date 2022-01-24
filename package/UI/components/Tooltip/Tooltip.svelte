<script lang="ts" context="module">
    export enum ETooltipPosition {
        bottom,
        right,
    }
</script>

<script lang="ts">
    import { _theme } from '../../theme'

    export let isHidden: boolean = false
    export let text: string = ''
    export let position: ETooltipPosition = ETooltipPosition.bottom
    export let style: string = ''
    export let classes: string = ''
    export let isBorder: boolean
</script>

{#if isHidden}
    <slot />
{:else}
    <div class="tooltip-wrapper {classes}" {style}>
        <slot />
        <div class="tooltip tooltip_position_{position} body4 font_math" class:border={isBorder === undefined ? $_theme.isBorder : isBorder}>{@html text}</div>
    </div>
{/if}
