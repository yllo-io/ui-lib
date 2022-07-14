<script>
    import { Meta, Template, Story } from '@storybook/addon-svelte-csf'
    import { Input } from '@yllo/ui-lib'
</script>

<Meta
    title="Components/Input"
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
    <div class="wrapper">
        <Input {...args} />
    </div>
</Template>

<Story name="Default" />

<Story name="Label" args={{ label: 'Label text' }} />

<Story name="Placeholder" args={{ placeholder: 'Placeholder text' }} />

<Story name="Incorrect" args={{ incorrect: 'Error text' }} />

<Story name="Right Label" args={{ rightLabel: 'Text' }} />

<Story name="Password" args={{ isPassword: true }} />

<Story name="Number" args={{ isNumber: true }} />

<Story name="Centered" args={{ isCentered: true }} />

<style>
    .wrapper {
        width: 300px;
    }
</style>
