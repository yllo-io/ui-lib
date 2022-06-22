<script>
    import { Meta, Template, Story } from '@storybook/addon-svelte-csf'
    import { Paper } from '@yllo/ui-lib'
    import Config from '../Config.svelte'
</script>

<Meta
    title="Example/Paper"
    component={Paper}
    argTypes={{
        isBorder: {
            type: { name: 'boolean' },
            control: {
                type: 'boolean',
            },
            table: {
                type: { summary: 'boolean' },
            },
        },
        isRounded: {
            type: { name: 'boolean' },
            control: {
                type: 'boolean',
            },
            table: {
                type: { summary: 'boolean' },
            },
        },
        isShadow: {
            type: { name: 'boolean' },
            control: {
                type: 'boolean',
            },
            table: {
                type: { summary: 'boolean' },
            },
        },
    }}
/>

<Template let:args>
    <Paper {...args}>
        <div class="color_line7">Some content</div>
    </Paper>
    <Config />
</Template>

<Story name="Paper" />
