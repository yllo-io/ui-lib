<script>
    import { Meta, Template, Story } from '@storybook/addon-svelte-csf'
    import { Stepper, StepperStepT } from '@yllo/ui-lib'
    import Config from '../Config.svelte'

    let stepIndex
</script>

<Meta
    title="Example/StepperComponent"
    component={Stepper}
    argTypes={{
        steps: {
            type: 'object',
            control: 'object',
            defaultValue: [{ name: 'Step 1' }, { name: 'Step 2' }, { name: 'Step 3' }],
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
            {:else if stepIndex === 1}
                <div class="color_line7">Content of step 2</div>
            {:else if stepIndex === 2}
                <div class="color_line7">Content of step 3</div>
            {/if}
        </Stepper>
    </div>
    <Config />
</Template>

<Story name="StepperComponent" />

<style>
    .wrapper {
        width: 400px;
    }
</style>
