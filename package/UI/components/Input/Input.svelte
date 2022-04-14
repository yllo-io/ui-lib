<script lang="ts">
    import { _theme } from '../../theme'
    import { imask } from '@imask/svelte'
    import { interactiveElement } from '../Cursor/interactiveCursor'
    import { _client } from '../../tools/client'

    export let value: string = ''
    export let label: string | false = false
    export let placeholder: string = ''
    export let isActive: boolean = true
    export let incorrect: string | false = false
    export let isStretched: boolean = false
    export let isRounded: boolean
    export let rightLabel: string | false = false
    export let isPassword: boolean = false
    export let isNumber: boolean = false
    export let imaskOptions: any = false
    export let autocomplete: string = 'off'
    export let isCentered: boolean = false

    export function focus() {
        input.focus()
    }

    let input: HTMLElement

    $: themeIsRounded = isRounded === undefined ? $_theme.isRounded : isRounded

    let passwordHidden: boolean = true
</script>

<div
    class="input"
    class:incorrect
    class:disabled={!isActive}
    class:stretched={isStretched}
    class:centered={isCentered}
    use:interactiveElement={{ isActive: !$_client.isMobile && $_theme.isInteractiveCursor && isActive }}
>
    {#if label}
        <span class="input__label">{label}</span>
    {/if}
    {#if isPassword}
        {#if passwordHidden}
            <input
                type="password"
                bind:value
                bind:this={input}
                on:keyup
                on:keydown
                on:input
                on:change
                on:click
                {placeholder}
                disabled={!isActive}
                class:rounded_light={themeIsRounded}
            />
        {:else}
            <input
                type="text"
                bind:value
                bind:this={input}
                on:keyup
                on:keydown
                on:input
                on:change
                on:click
                {placeholder}
                disabled={!isActive}
                class:rounded_light={themeIsRounded}
            />
        {/if}
    {:else if isNumber}
        {#if imaskOptions}
            <input
                type="number"
                bind:value
                bind:this={input}
                on:keyup
                on:keydown
                on:input
                on:change
                on:click
                use:imask={imaskOptions}
                {autocomplete}
                {placeholder}
                disabled={!isActive}
                class:rounded_light={themeIsRounded}
            />
        {:else}
            <input
                type="number"
                bind:value
                bind:this={input}
                on:keyup
                on:keydown
                on:input
                on:change
                on:click
                {autocomplete}
                {placeholder}
                disabled={!isActive}
                class:rounded_light={themeIsRounded}
            />
        {/if}
    {:else if imaskOptions}
        <input
            type="text"
            bind:value
            bind:this={input}
            on:keyup
            on:keydown
            on:input
            on:change
            on:click
            use:imask={imaskOptions}
            {autocomplete}
            {placeholder}
            disabled={!isActive}
            class:rounded_light={themeIsRounded}
        />
    {:else}
        <input
            type="text"
            bind:value
            bind:this={input}
            on:keyup
            on:keydown
            on:input
            on:change
            on:click
            {autocomplete}
            {placeholder}
            disabled={!isActive}
            class:rounded_light={themeIsRounded}
        />
    {/if}
    {#if rightLabel || isPassword}
        <div class="right">
            {#if rightLabel}
                <span class="right__label">{rightLabel}</span>
            {/if}
            {#if isPassword}
                <div
                    class="right__eye"
                    on:click={() => {
                        passwordHidden = !passwordHidden
                    }}
                >
                    {#if passwordHidden}
                        <svg width="14" height="8" viewBox="0 0 14 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M6.25 3.5C6.25 3.5 6 5 6.25 4.75C6.5 4.5 6.45328 3.64375 7.75 3.5M6.25 3.5V3.25H7.75C7.75 3.25 7.75 3 7.75 3.5M6.25 3.5H7.75M1 4C1 3.25 4 1 7 1C10 1 13 3.25 13 4C13 4.75 10.75 7 7 7C3.25 7 1 4.75 1 4ZM8.5 4V4C8.5 4.82843 7.82843 5.5 7 5.5V5.5C6.17157 5.5 5.5 4.82843 5.5 4V4C5.5 3.17157 6.17157 2.5 7 2.5V2.5C7.82843 2.5 8.5 3.17157 8.5 4Z"
                                stroke="#707070"
                            />
                        </svg>
                    {:else}
                        <svg width="14" height="8" viewBox="0 0 14 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M2.125 4C4.75 5.5 8.88829 5.68906 11.875 4M1 4C1 3.25 4 1 7 1C10 1 13 3.25 13 4C13 4.75 10.75 7 7 7C3.25 7 1 4.75 1 4Z"
                                stroke="#707070"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                        </svg>
                    {/if}
                </div>
            {/if}
        </div>
    {/if}
    {#if incorrect}
        <span class="input__incorrect-label">{incorrect}</span>
    {/if}
</div>
