<script>
    import { Meta, Template, Story } from '@storybook/addon-svelte-csf'
    import { Paper } from '@yllo/ui-lib'
</script>

<Meta
    title="Paper"
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
</Template>

<Story name="Default" />

<Story name="Border" args={{ isBorder: true, isPadding: true }} />

<Story name="Rounded" args={{ isBorder: true, isRounded: true, isPadding: true }} />

<Story name="Shadow" args={{ isShadow: true, isPadding: true }} />

<Story name="Strong Shadow" args={{ isShadowStrong: true, isPadding: true }} />
