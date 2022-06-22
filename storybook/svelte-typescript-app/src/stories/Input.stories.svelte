<script>
    import { Meta, Template, Story } from '@storybook/addon-svelte-csf'
    import { Input } from '@yllo/ui-lib'
    import Config from '../Config.svelte'
</script>

<Meta
    title="Example/Input"
    component={Input}
    argTypes={{
        label: {
            type: 'string',
            control: 'text',
            table: {
                type: { summary: 'string | false' },
                defaultValue: { summary: 'false' },
            },
        },
        incorrect: {
            type: 'string',
            control: 'text',
            table: {
                type: { summary: 'string | false' },
                defaultValue: { summary: 'false' },
            },
        },
        rightLabel: {
            type: 'string',
            control: 'text',
            table: {
                type: { summary: 'string | false' },
                defaultValue: { summary: 'false' },
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
        imaskOptions: {
            type: 'boolean',
            defaultValue: false,
            control: { type: 'object' },
            table: {
                type: { summary: 'any' },
                defaultValue: { summary: 'false' },
            },
        },
    }}
/>

<Template let:args>
    <Input {...args} />
    <Config />
</Template>

<Story name="Input" />
