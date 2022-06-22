<script>
    import { Meta, Template, Story } from '@storybook/addon-svelte-csf'
    import { Tooltip, ETooltipPosition, Button } from '@yllo/ui-lib'
    import Config from '../Config.svelte'
</script>

<Meta
    title="Example/TooltipComponent"
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
        <Button>Button with tooltip</Button>
    </Tooltip>
    <Config />
</Template>

<Story name="TooltipComponent" />
