<script lang="ts">
    import { _theme } from '../../theme'
    import { interactiveElement } from '../Cursor/interactiveCursor'
    import { _client } from '../../tools/client'

    export let isActive: boolean = true
    export let placeholder: string = ''
    export let label: string | false = false
    export let value: string | number = ''
    export let isResize: boolean = false

    export function focus() {
        textarea.focus()
    }

    let textarea: HTMLElement
</script>

<div
    class="textarea"
    class:disabled={!isActive}
    class:resize={isResize}
    use:interactiveElement={{ isActive: !$_client.isMobile && $_theme.isInteractiveCursor && isActive }}
>
    {#if label}
        <span class="textarea__label">{label}</span>
    {/if}
    <textarea bind:value bind:this={textarea} {placeholder} disabled={!isActive} on:keyup on:keydown on:input on:change on:click />
</div>
