<script lang="ts">
    import { slide } from 'svelte/transition'
    import { StepperStepT } from './stepper'
    import { _theme } from '../../theme'
    import { interactiveElement } from '../Cursor/interactiveCursor'
    import { _client } from '../../tools/client'
    export let steps: StepperStepT[]
    export let stepIndex: number = 0
    export let onStepClick: Function
    export let isScrollIntoView: boolean = false

    let stepTitlesElements = {}
    $: stepIndex, isScrollIntoView && stepTitlesElements[stepIndex] && stepTitlesElements[stepIndex].scrollIntoView()
</script>

<div class="stepper">
    {#each steps as step, index}
        <div
            class="step-title"
            bind:this={stepTitlesElements[index]}
            class:visited={step.isVisited || index <= stepIndex}
            on:click={() => {
                if (step.isClickable && onStepClick && stepIndex !== index) {
                    stepIndex = index
                    onStepClick(index)
                }
            }}
            use:interactiveElement={{
                isActive: !$_client.isMobile && $_theme.isInteractiveCursor && !!step.isClickable && stepIndex !== index,
                isCursorHover: false,
            }}
        >
            <div class="step-title__number body1 color_line1">{index + 1}</div>
            <div class="step-title__name body1">{step.name}</div>
            {#if step.isDone}
                <div class="step-title__done body2">Done</div>
            {/if}
        </div>
        {#if stepIndex === index}
            <div class="step-content" transition:slide|local={{ duration: 300 }}>
                <slot />
            </div>
        {/if}
    {/each}
</div>
