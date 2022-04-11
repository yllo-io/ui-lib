<script lang="ts">
  import { getGradientById } from "../../tools/avatarColors";
  import { EAvatarShape } from "./avatar";
  export let image: string | false = false;
  export let name: string;
  export let id: number;
  export let size: number = 1;
  export let variant: EAvatarShape = EAvatarShape.circle;
  export let isOnline: boolean = false;
</script>

<div class="avatar avatar_variant_{variant} avatar_size_{size}">
  <div
    class="avatar__inner"
    style="background-image: {image
      ? `url(${image})`
      : getGradientById(id || 0)};"
  >
    {name && !image ? name.charAt(0).toUpperCase() : ""}
  </div>
  {#if isOnline}
    <div class="avatar__online" />
  {/if}
</div>
