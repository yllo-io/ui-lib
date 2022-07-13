<script>
    import { Meta, Template, Story } from '@storybook/addon-svelte-csf'
    import { Checkbox } from '@yllo/ui-lib'

    let state = true
</script>

<Meta
    title="Checkbox"
    component={Checkbox}
    argTypes={{
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
        isOutlined: {
            type: { name: 'boolean' },
            defaultValue: false,
            control: {
                type: 'boolean',
            },
        },
    }}
/>

<Template let:args>
    <Checkbox {...args} bind:state>Checkbox</Checkbox>
</Template>

<Story name="Default" args={{}} />

<Story name="Outlined" args={{ isOutlined: true }} />
