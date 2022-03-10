<script lang="ts">
    import { _theme } from '../../theme'
    import { interactiveElement } from '../Cursor/interactiveCursor'

    export let tabs: string[] = []
    export let active: number = 0
    export let isRounded: boolean
</script>

<div class="tabs" class:rounded={isRounded === undefined ? $_theme.isRounded : isRounded}>
    {#each tabs as tab, index}
        <div
            class="tabs__item"
            use:interactiveElement={{ isActive: $_theme.isInteractiveCursor && active !== index }}
            class:rounded_light={isRounded === undefined ? $_theme.isRounded : isRounded}
            class:active={active === index}
            on:click={() => (active = index)}
        >
            {tab}
        </div>
    {/each}
</div>
