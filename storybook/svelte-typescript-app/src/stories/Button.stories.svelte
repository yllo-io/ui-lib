<script>
    import { Meta, Template, Story } from '@storybook/addon-svelte-csf'
    import { Button, EButtonVariant, EColor } from '@yllo/ui-lib'
</script>

<Meta
    title="Button"
    component={Button}
    argTypes={{
        // Props example
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
        variant: {
            // type: { name: EButtonVariant, required: true },
            options: Object.values(EButtonVariant).filter((x) => typeof x === 'number'),
            // mapping: EButtonVariant,
            defaultValue: EButtonVariant.filled,
            control: {
                type: 'select',
                labels: Object.values(EButtonVariant).filter((x) => typeof x === 'string'),
            },
            table: {
                type: { summary: 'EButtonVariant' },
                defaultValue: { summary: 'outlined' },
            },
        },
        backgroundColor: {
            options: Object.keys(EColor),
            defaultValue: EColor.contrast3,
            control: {
                type: 'select',
                labels: Object.values(EColor),
            },
            table: {
                type: { summary: 'EColor' },
                defaultValue: { summary: 'contrast3' },
            },
        },
        color: {
            options: Object.keys(EColor),
            defaultValue: EColor.line1,
            control: {
                type: 'select',
                labels: Object.values(EColor),
            },
            table: {
                type: { summary: 'EColor' },
                defaultValue: { summary: 'line1' },
            },
        },
    }}
/>

<Template let:args>
    <Button {...args} on:click={args.onClick}>Button</Button>
</Template>

<Story name="Outlined" args={{ variant: EButtonVariant.outlined, color: EColor.line7 }} />

<Story name="Outlined 2" args={{ variant: EButtonVariant.outlined2, color: EColor.line7 }} />

<Story name="Filled" args={{ variant: EButtonVariant.filled, color: EColor.line1 }} />

<Story name="Text" args={{ variant: EButtonVariant.text, color: EColor.line4 }} />

<Story name="Text 2" args={{ variant: EButtonVariant.text2, color: EColor.line5 }} />
