<script>
    import { Meta, Template, Story } from '@storybook/addon-svelte-csf'
    import { Button, EButtonVariant, EColor } from '@yllo/ui-lib'
    import Config from '../Config.svelte'
</script>

<!-- More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export -->
<!-- More on argTypes: https://storybook.js.org/docs/svelte/api/argtypes -->
<Meta
    title="Example/Button"
    component={Button}
    argTypes={{
        // Props example
        isRounded: {
            type: 'boolean',
            defaultValue: true,
            control: {
                type: 'boolean',
            },
            table: {
                type: { summary: 'boolean' },
            },
        },
        variant: {
            // type: { name: EButtonVariant, required: true },
            options: Object.values(EButtonVariant).filter((x) => typeof x === 'number'),
            // mapping: EButtonVariant,
            defaultValue: EButtonVariant.filled,
            control: {
                type: 'select',
                labels: Object.values(EButtonVariant).filter((x) => typeof x === 'string'),
            },
            table: {
                type: { summary: 'EButtonVariant' },
                defaultValue: { summary: 'outlined' },
            },
        },
        backgroundColor: {
            options: Object.keys(EColor),
            defaultValue: EColor.contrast3,
            control: {
                type: 'select',
                labels: Object.values(EColor),
            },
            table: {
                type: { summary: 'EColor' },
                defaultValue: { summary: 'contrast3' },
            },
        },
        color: {
            options: Object.keys(EColor),
            defaultValue: EColor.line1,
            control: {
                type: 'select',
                labels: Object.values(EColor),
            },
            table: {
                type: { summary: 'EColor' },
                defaultValue: { summary: 'line1' },
            },
        },
    }}
/>

<!-- More on component templates: https://storybook.js.org/docs/svelte/writing-stories/introduction#using-args -->
<Template let:args>
    <Button {...args} on:click={args.onClick}>Button</Button>
    <!-- TODO: transfer config to global decorator -->
    <Config />
</Template>

<!-- More on args: https://storybook.js.org/docs/svelte/writing-stories/args -->

<!-- <Story
  name="Filled"
  args={{
    variant: EButtonVariant.filled,
  }}
/> -->

<Story name="Button" />

<!-- 

<Story
  name="Secondary"
  args={{
    label: "Button",
  }}
/>
<Story
  name="Large"
  args={{
    size: "large",
    label: "Button",
  }}
/>

<Story
  name="Small"
  args={{
    size: "small",
    label: "Button",
  }}
/> -->
