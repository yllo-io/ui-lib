<script lang="ts">
    import { _theme } from '../../theme'

    export let isBorder: boolean
    export let isRounded: boolean
    export let isShadow: boolean
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
    class:rounded={isRounded === undefined ? $_theme.isRounded : isRounded}
    class:shadow_strong={isShadowStrong}
    class:shadow={isShadow === undefined ? $_theme.isShadow : isShadow}
    class:column={isColumn}
    class:background={isBackground}
    class:border={isBorder === undefined ? $_theme.isBorder : isBorder}
>
    <slot />
</div>
