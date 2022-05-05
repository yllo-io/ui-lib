<script lang="ts">
    import { createEventDispatcher } from 'svelte'
    import { interactiveElement } from '../Cursor/interactiveCursor'
    import { _theme } from '../../theme'
    import Scrollbar from '../Scrollbar/Scrollbar.svelte'
    import type { SvelteComponent } from 'svelte'
    import { SelectValueT } from './select'
    import { _client } from '../../tools/client'

    export let list: SelectValueT[] = []
    export let isActive: boolean = true
    export let isRounded: boolean
    export let minWidth: string | false = false
    export let OptionComponent: typeof SvelteComponent
    export let LabelComponent: typeof SvelteComponent
    export let isMultiSelect: boolean = false

    export let selectedItemIndexes: number[] = [0]

    export function close() {
        isOpen = false
    }

    const dispatch = createEventDispatcher()

    let isOpen: boolean = false
    let listWrapper, listContainer

    function onSelect(index) {
        if (isMultiSelect) {
            if (selectedItemIndexes.includes(index)) {
                if (selectedItemIndexes.length > 1) selectedItemIndexes = selectedItemIndexes.filter((i) => i !== index)
            } else selectedItemIndexes.push(index)
            selectedItemIndexes = selectedItemIndexes
        } else {
            selectedItemIndexes = [index]
            isOpen = false
        }
        dispatch(
            'change',
            list.filter((_, index) => selectedItemIndexes.includes(index))
        )
    }
</script>

<div class="select">
    {#if LabelComponent}
        <svelte:component
            this={LabelComponent}
            selectedItems={list.filter((_, index) => selectedItemIndexes.includes(index))}
            {isOpen}
            on:click={() => (isOpen = !isOpen)}
        />
    {:else}
        <div
            class="label"
            class:rounded_light={isRounded === undefined ? $_theme.isRounded : isRounded}
            style={minWidth ? 'min-width: ' + minWidth : ''}
            on:click={() => (isOpen = !isOpen)}
            use:interactiveElement={{
                isActive: !$_client.isMobile && $_theme.isInteractiveCursor && isActive,
            }}
        >
            <div class="label__value color_line6 noselect">
                {@html list[selectedItemIndexes[0]].value}
            </div>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" class="svg-arrow svelte-qu6obu"
                ><path d="M3.33337 6L8.00004 10L12.6667 6" stroke="#BABABA" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg
            >
        </div>
    {/if}

    {#if isOpen}
        <div class="list">
            <Scrollbar wrapper={listWrapper} container={listContainer} hideNotActive={true} />
            <div class="list__wrapper shadow" bind:this={listWrapper} class:rounded_light={isRounded === undefined ? $_theme.isRounded : isRounded}>
                <div class="list__container paper" bind:this={listContainer}>
                    {#each list as item, index}
                        <div class="item" class:selected={selectedItemIndexes.includes(index)} on:click={() => onSelect(index)}>
                            {#if OptionComponent}
                                <svelte:component this={OptionComponent} {item} isSelected={selectedItemIndexes.includes(index)} />
                            {:else}
                                <div
                                    class="item__name body1 color_line6 noselect"
                                    use:interactiveElement={{
                                        isActive: !$_client.isMobile && $_theme.isInteractiveCursor && isActive,
                                        isCursorHover: false,
                                    }}
                                >
                                    {@html item.value}
                                </div>
                            {/if}
                        </div>
                    {/each}
                </div>
            </div>
        </div>
    {/if}
</div>
