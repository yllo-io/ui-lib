<script lang="ts">
    import type { ThemeOptions } from '@yllo/ui-lib'
    import { setThemeOptions } from '@yllo/ui-lib/dist/UI/main'
    import { EThemeType } from '@yllo/ui-lib/dist/UI/types'
    import { onMount } from 'svelte'

    onMount(() => {
        setThemeOptions({
            themeType: EThemeType.dark,
            isInteractiveCursor: true,
        } as ThemeOptions)
    })
</script>

<div class="theme-wrapper">
    <slot />
</div>

<style lang="scss" global>
    @import '../node_modules/@yllo/ui-lib/UI/theme.scss';
    @import '../node_modules/@yllo/ui-lib/UI/lib.scss';
    @import './assets/css/global.css';

    .theme-wrapper {
        background: var(--line-1);
        padding: 30px;
    }
</style>
