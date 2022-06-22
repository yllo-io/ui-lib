<script>
    import { Meta, Template, Story } from '@storybook/addon-svelte-csf'
    import { Slider } from '@yllo/ui-lib'
    import Config from '../Config.svelte'
</script>

<Meta title="Example/SliderCompoent" component={Slider} argTypes={{}} />

<Template let:args>
    <div class="wrapper">
        <Slider {...args} />
    </div>
    <Config />
</Template>

<Story name="SliderCompoent" />

<style>
    .wrapper {
        width: 260px;
    }
</style>
