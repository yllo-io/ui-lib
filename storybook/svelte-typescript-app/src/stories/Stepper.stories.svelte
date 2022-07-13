<script>
    import { Meta, Template, Story } from '@storybook/addon-svelte-csf'
    import { Stepper, StepperStepT, Button, EColor } from '@yllo/ui-lib'

    let stepIndex
</script>

<Meta
    title="Stepper"
    component={Stepper}
    argTypes={{
        steps: {
            type: 'object',
            control: 'object',
            defaultValue: [{ name: 'Step 1', isClickable: true }, { name: 'Step 2' }, { name: 'Step 3' }],
            table: {
                type: { summary: 'StepperStepT' },
            },
        },
        stepIndex: {
            control: {
                type: null,
            },
        },
    }}
/>

<Template let:args>
    <div class="wrapper">
        <Stepper {...args} bind:stepIndex>
            {#if stepIndex === 0}
                <div class="color_line7">Content of step 1</div>
                <Button on:click={() => stepIndex++} color={EColor.line7}>Next</Button>
            {:else if stepIndex === 1}
                <div class="color_line7">Content of step 2</div>
            {:else if stepIndex === 2}
                <div class="color_line7">Content of step 3</div>
            {/if}
        </Stepper>
    </div>
</Template>

<Story name="Default" />

<style>
    .wrapper {
        width: 300px;
    }
</style>
