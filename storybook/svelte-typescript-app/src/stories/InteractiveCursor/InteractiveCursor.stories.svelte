<script>
    import { Meta, Template, Story } from '@storybook/addon-svelte-csf'
    import { interactiveElement } from '@yllo/ui-lib'
    import docs from './docs.mdx'
</script>

<Meta
    title="Components/Interactive Cursor"
    parameters={{
        docs: {
            page: docs,
        },
    }}
/>

<Story name="Example">
    <div use:interactiveElement={{ isActive: true }}>
        <img src="https://source.unsplash.com/random/100×100" alt="" />
    </div>
</Story>

<Story name="Example 2">
    <div use:interactiveElement={{ isActive: true, isCursorHover: false }}>
        <img src="https://source.unsplash.com/random/100×100" alt="" />
    </div>
</Story>

<Story name="Example 3">
    <div use:interactiveElement={{ isActive: true, translateFactorY: 0 }}>
        <img src="https://source.unsplash.com/random/100×100" alt="" />
    </div>
</Story>

<style>
    div {
        display: inline-block;
        margin: 30px;
    }
    div :global(.interactive-cursor-hover) {
        --scale: 1.1;
        --scale-hover: 1.1;
    }
    img {
        width: 100px;
        height: 100px;
        object-fit: cover;
    }
</style>
