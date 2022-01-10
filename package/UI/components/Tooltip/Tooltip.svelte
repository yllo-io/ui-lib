<script lang="ts" context="module">
    export enum ETooltip {
        bottom,
        right,
    }
</script>

<script lang="ts">
    export let text: string = ''
    export let position: ETooltip = ETooltip.bottom
    export let style: string = ''
    export let _class: string = ''
</script>

<div class="tooltip-wrapper {_class}" {style}>
    <slot />
    <div class="tooltip tooltip_position_{position} body4_math">{text}</div>
</div>
