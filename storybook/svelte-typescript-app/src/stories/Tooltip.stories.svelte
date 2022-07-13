<script>
    import { Meta, Template, Story } from '@storybook/addon-svelte-csf'
    import { Tooltip, ETooltipPosition, Button, EColor } from '@yllo/ui-lib'
</script>

<Meta
    title="Tooltip"
    component={Tooltip}
    argTypes={{
        text: {
            defaultValue: 'Tooltip text',
        },
        position: {
            options: Object.values(ETooltipPosition).filter((x) => typeof x === 'number'),
            control: {
                type: 'select',
                labels: Object.values(ETooltipPosition).filter((x) => typeof x === 'string'),
            },
            table: {
                type: { summary: 'ETooltipPosition' },
                defaultValue: { summary: 'bottom' },
            },
        },
    }}
/>

<Template let:args>
    <Tooltip {...args}>
        <Button color={EColor.line7}>Button with tooltip</Button>
    </Tooltip>
</Template>

<Story name="Default" />

<Story name="Right" args={{ position: ETooltipPosition.right }} />

<Story name="HTML Tags" args={{ text: 'Text with <b>html</b> <br> <i>tags</i>' }} />
