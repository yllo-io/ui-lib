<script>
    import { Meta, Template, Story } from '@storybook/addon-svelte-csf'
    import { Avatar, EAvatarShape } from '@yllo/ui-lib'
</script>

<Meta
    title="Components/Avatar"
    component={Avatar}
    argTypes={{
        image: { control: { type: 'text' }, table: { type: { summary: 'string | false' } } },
        name: { defaultValue: 'Yllo', type: 'string', control: { type: 'text' }, table: { type: { summary: 'string' } } },
        id: { type: 'number', control: { type: 'number' }, table: { type: { summary: 'number' } } },
        variant: {
            type: 'EAvatarShape',
            options: Object.values(EAvatarShape).filter((x) => typeof x === 'number'),
            control: {
                type: 'select',
                labels: Object.values(EAvatarShape).filter((x) => typeof x === 'string'),
            },
            table: { type: { summary: 'EAvatarShape' }, defaultValue: { summary: 'circle' } },
        },
    }}
/>

<Template let:args>
    <Avatar {...args} />
</Template>

<Story name="Avatar" />
