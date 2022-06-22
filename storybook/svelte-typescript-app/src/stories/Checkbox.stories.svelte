<script>
    import { Meta, Template, Story } from '@storybook/addon-svelte-csf'
    import { Checkbox } from '@yllo/ui-lib'
    import Config from '../Config.svelte'

    let state = true
</script>

<Meta
    title="Example/Checkbox"
    component={Checkbox}
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
    <Config />
</Template>

<Story name="Checkbox" />
