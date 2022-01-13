<script lang="ts">
    export let isRounded: boolean = true
    export let isShadow: boolean = true
    export let isShadowStrong: boolean = false
    export let isColumn: boolean = false
    export let isPadding: boolean = false
    export let isCenter: boolean = false
    export let isBackground: boolean = false
</script>

<div
    class="paper body1"
    class:flex_center-center={isCenter}
    class:padding={isPadding}
    class:rounded={isRounded}
    class:shadow_strong={isShadowStrong}
    class:shadow={isShadow}
    class:column={isColumn}
    class:background={isBackground}
>
    <slot />
</div>
