<script>
    import { Meta, Template, Story } from '@storybook/addon-svelte-csf'
    import { Textarea } from '@yllo/ui-lib'
    import Config from '../Config.svelte'
</script>

<Meta
    title="Example/TextareaComponent"
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
    <Config />
</Template>

<Story name="TextareaComponent" />

<style>
    .wrapper {
        width: 400px;
    }
</style>
