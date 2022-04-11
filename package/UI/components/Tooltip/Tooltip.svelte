<script lang="ts">
  import { ETooltipPosition } from "./tooltip";

  export let isHidden: boolean = false;
  export let text: string = "";
  export let position: ETooltipPosition = ETooltipPosition.bottom;
  export let style: string = "";
  export let classes: string = "";
  export let isBorder: boolean = true;
</script>

{#if isHidden}
  <slot />
{:else}
  <div class="tooltip-wrapper {classes}" {style}>
    <slot />
    <div
      class="tooltip tooltip_position_{position} body2"
      class:border={isBorder}
    >
      {@html text}
    </div>
  </div>
{/if}
