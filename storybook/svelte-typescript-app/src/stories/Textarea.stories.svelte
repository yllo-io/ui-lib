<script>
    import { Meta, Template, Story } from '@storybook/addon-svelte-csf'
    import { Textarea } from '@yllo/ui-lib'
</script>

<Meta
    title="Components/Textarea"
    component={Textarea}
    argTypes={{
        label: {
            control: 'text',
            table: {
                type: { summary: 'string | false' },
            },
        },
    }}
/>

<Template let:args>
    <div class="wrapper">
        <Textarea {...args} />
    </div>
</Template>

<Story name="Default" />

<Story name="Label" args={{ label: 'label text' }} />

<!-- <Story name="Resize" args={{ isResize: true }} /> -->

<style>
    .wrapper {
        width: 400px;
    }
</style>
