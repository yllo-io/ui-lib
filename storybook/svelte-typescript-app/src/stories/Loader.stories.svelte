<script>
    import { Meta, Template, Story } from '@storybook/addon-svelte-csf'
    import { Loader } from '@yllo/ui-lib'
</script>

<Meta title="Components/Loader" component={Loader} argTypes={{}} />

<Template let:args>
    <Loader {...args} />
</Template>

<Story name="Default" args={{ isContrast: false }} />

<Story name="Contrast" args={{ isContrast: true }} />
