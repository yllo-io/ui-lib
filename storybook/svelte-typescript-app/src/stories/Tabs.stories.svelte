<script>
    import { Meta, Template, Story } from '@storybook/addon-svelte-csf'
    import { Tabs } from '@yllo/ui-lib'

    let active
</script>

<Meta
    title="Components/Tabs"
    component={Tabs}
    argTypes={{
        tabs: {
            type: 'object',
            control: 'object',
            defaultValue: ['Tab 1', 'Tab 2', 'Tab 3'],
            table: {
                type: { summary: 'string[]' },
            },
        },
        active: {
            control: {
                type: null,
            },
        },
        isRounded: {
            type: 'boolean',
            defaultValue: true,
            control: {
                type: 'boolean',
            },
            table: {
                type: { summary: 'boolean' },
            },
        },
    }}
/>

<Template let:args>
    <div class="wrapper">
        <Tabs {...args} bind:active />
        {#if active === 0}
            <div class="color_line7">Content of tab 1</div>
        {:else if active === 1}
            <div class="color_line7">Content of tab 2</div>
        {:else if active === 2}
            <div class="color_line7">Content of tab 3</div>
        {/if}
    </div>
</Template>

<Story name="Default" />

<style>
    .wrapper {
        width: 400px;
    }
</style>
