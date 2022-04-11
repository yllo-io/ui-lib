<script>
  import { Meta, Template, Story } from "@storybook/addon-svelte-csf";
  import { Button } from "@yllo/ui-lib";
</script>

<!-- More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export -->
<!-- More on argTypes: https://storybook.js.org/docs/svelte/api/argtypes -->
<Meta
  title="Example/Button"
  component={Button}
  argTypes={{
    // backgroundColor: { control: "color" },
    // label: { control: "text" },
    // onClick: { action: "onClick" },
    // primary: { control: "boolean" },
    // size: {
    //   control: { type: "select" },
    //   options: ["small", "medium", "large"],
    // },
  }}
/>

<!-- More on component templates: https://storybook.js.org/docs/svelte/writing-stories/introduction#using-args -->
<Template let:args>
  <Button>123</Button>
</Template>

<!-- More on args: https://storybook.js.org/docs/svelte/writing-stories/args -->
<Story name="Primary" />
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
