<script lang="ts" context="module">
    export enum EAvatar {
        circle,
        squircle,
    }
</script>

<script lang="ts">
    export let background: string = 'linear-gradient(180deg, #F2793D 0%, #F89E39 100%)'
    export let symbol: string | false = false
    export let size: number = 1
    export let variant: EAvatar = EAvatar.circle
    export let online: boolean = false
</script>

<div class="avatar avatar_variant_{variant} avatar_size_{size}">
    <div class="avatar__inner" style="background: {background};">
        {symbol ? symbol : ''}
    </div>
    {#if online}
        <div class="avatar__online"></div>
    {/if}
</div>
