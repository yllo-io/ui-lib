<script>
    import { Meta, Template, Story } from '@storybook/addon-svelte-csf'
    import { Loader } from '@yllo/ui-lib'
    import Config from '../Config.svelte'
</script>

<Meta title="Example/LoaderComponent" component={Loader} argTypes={{}} />

<Template let:args>
    <Loader {...args} />
    <Config />
</Template>

<Story name="LoaderComponent" />
