<script lang="ts" context="module">
    export enum EAvatarShape {
        circle,
        squircle,
    }
</script>

<script lang="ts">
    export let background: string = 'linear-gradient(180deg, #F2793D 0%, #F89E39 100%)'
    export let symbol: string | false = false
    export let size: number = 1
    export let variant: EAvatarShape = EAvatarShape.circle
    export let isOnline: boolean = false
</script>

<div class="avatar avatar_variant_{variant} avatar_size_{size}">
    <div class="avatar__inner" style="background: {background};">
        {symbol ? symbol : ''}
    </div>
    {#if isOnline}
        <div class="avatar__online" />
    {/if}
</div>
