<script>
    import { Meta, Template, Story } from '@storybook/addon-svelte-csf'
    import { Select, SelectValueT } from '@yllo/ui-lib'
    import CustomLabel from './assets/Select/CustomLabel.svelte'
    import CustomOption from './assets/Select/CustomOption.svelte'
</script>

<Meta
    title="Select"
    component={Select}
    argTypes={{
        list: {
            type: 'object',
            defaultValue: [{ value: 'Option1' }, { value: 'Option2' }, { value: 'Option3' }, { value: 'Option4' }],
            table: {
                type: { summary: 'SelectValueT[]' },
                defaultValue: { summary: '[]' },
            },
        },
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
        minWidth: {
            type: 'string',
            control: 'text',
            table: {
                type: { summary: 'string | false' },
                defaultValue: { summary: 'false' },
            },
        },
        OptionComponent: {
            control: {
                type: null,
            },
            table: {
                type: { summary: 'component' },
            },
        },
        LabelComponent: {
            control: {
                type: null,
            },
            table: {
                type: { summary: 'component' },
            },
        },
        selectedItemIndexes: {
            table: {
                type: { summary: 'number[]' },
                defaultValue: { summary: '[0]' },
            },
        },
    }}
/>

<Template let:args>
    <!-- CustomLabel.svelte
        <script lang="ts">
            import type { SelectValueT } from '@yllo/ui-lib'

            export let selectedItems: SelectValueT[] = []
            export let isOpen: boolean
        </script>

        <div on:click class="color_line7 noselect" class:background-color_contrast1={isOpen}>
            Selected: {selectedItems[0].value}
        </div>
    -->
    <!-- CustomOption.svelte
        <script lang="ts">
            import type { SelectValueT } from '@yllo/ui-lib'

            export let item: SelectValueT
            export let isSelected: boolean
        </script>

        <div on:click class="color_line7 noselect" class:background-color_contrast1={isSelected}>
            - {item.value} -
        </div>
    -->
    <div class="wrapper">
        <Select {...args} />
    </div>
</Template>

<Story name="Default" />

<Story name="Multi Select" args={{ isMultiSelect: true }} />

<Story name="Options & Label components" args={{ LabelComponent: CustomLabel, OptionComponent: CustomOption }} />

<style>
    .wrapper {
        width: 200px;
        height: 200px;
    }
</style>
