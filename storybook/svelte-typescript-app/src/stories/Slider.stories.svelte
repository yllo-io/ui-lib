<script>
    import { Meta, Template, Story } from '@storybook/addon-svelte-csf'
    import { Slider } from '@yllo/ui-lib'
</script>

<Meta title="Components/Slider" component={Slider} argTypes={{}} />

<Template let:args>
    <div class="wrapper">
        <Slider {...args} />
    </div>
</Template>

<Story name="Default" />

<Story name="No legend" args={{ isLegend: false }} />

<Story name="Legend Frequency" args={{ legendFrequency: 2 }} />

<style>
    .wrapper {
        width: 260px;
    }
</style>
