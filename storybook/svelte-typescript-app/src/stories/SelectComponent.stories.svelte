<script>
    import { Meta, Template, Story } from '@storybook/addon-svelte-csf'
    import { Select, SelectValueT } from '@yllo/ui-lib'
    import Config from '../Config.svelte'
</script>

<Meta
    title="Example/SelectComponent"
    component={Select}
    argTypes={{
        list: {
            type: 'object',
            defaultValue: [{ value: 'Option1' }, { value: 'Option2' }, { value: 'Option3' }, { value: 'Option4' }],
            table: {
                type: { summary: 'SelectValueT[]' },
                defaultValue: { summary: '[]' },
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
        minWidth: {
            type: 'string',
            control: 'text',
            table: {
                type: { summary: 'string | false' },
                defaultValue: { summary: 'false' },
            },
        },
        OptionComponent: {
            control: {
                type: null,
            },
            table: {
                type: { summary: 'component' },
            },
        },
        LabelComponent: {
            control: {
                type: null,
            },
            table: {
                type: { summary: 'component' },
            },
        },
        selectedItemIndexes: {
            table: {
                type: { summary: 'number[]' },
                defaultValue: { summary: '[0]' },
            },
        },
    }}
/>

<Template let:args>
    <div class="wrapper">
        <Select {...args} />
    </div>
    <Config />
</Template>

<Story name="SelectComponent" />

<style>
    .wrapper {
        width: 200px;
        height: 300px;
    }
</style>
