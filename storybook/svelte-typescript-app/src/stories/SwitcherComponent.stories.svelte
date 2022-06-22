<script>
    import { Meta, Template, Story } from '@storybook/addon-svelte-csf'
    import { Switcher } from '@yllo/ui-lib'
    import Config from '../Config.svelte'

    let state
</script>

<Meta
    title="Example/SwitcherComponent"
    component={Switcher}
    argTypes={{
        // Props example
        state: {
            type: { name: 'boolean' },
            control: {
                type: null,
            },
            table: {
                type: { summary: 'boolean' },
            },
        },
        isActive: {
            type: { name: 'boolean' },
            defaultValue: true,
            control: {
                type: 'boolean',
            },
        },
        isBinding: {
            control: {
                type: null,
            },
        },
    }}
/>

<Template let:args>
    <Switcher {...args} isBinding bind:state />
    <Config />
</Template>

<Story name="SwitcherComponent" />
