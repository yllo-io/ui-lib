<script>
    import { Meta, Template, Story } from '@storybook/addon-svelte-csf'
    import { Switcher } from '@yllo/ui-lib'

    let state
</script>

<Meta
    title="Components/Switcher"
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
</Template>

<Story name="Default" />
