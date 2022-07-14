<script>
    import { Meta, Template, Story } from '@storybook/addon-svelte-csf'
    import { Scrollbar } from '@yllo/ui-lib'

    let wrapper, container
</script>

<Meta
    title="Components/Scrollbar"
    component={Scrollbar}
    argTypes={{
        wrapper: {
            control: {
                type: null,
            },
            table: {
                type: { summary: 'HTMLElement' },
            },
        },
        container: {
            control: {
                type: null,
            },
            table: {
                type: { summary: 'HTMLElement' },
            },
        },
        hideNotActive: {
            description: '',
        },
        scrollByTrackSpeed: {
            description: 'pixels per millisecond',
        },
    }}
/>

<Template let:args>
    <div class="wrapper">
        <Scrollbar {...args} {wrapper} {container} />
        <div bind:this={wrapper} class="container-wrapper">
            <div bind:this={container} class="container color_line7">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
                veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate
                velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit
                anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in
                reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui
                officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore
                et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute
                irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident,
                sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
                incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
                consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
                cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit,
                sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
                aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
                Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
            </div>
        </div>
    </div>
</Template>

<Story name="Default" />

<Story name="Thumb is always visible" args={{ hideNotActive: false }} />

<style>
    .wrapper {
        position: relative;
        max-width: 300px;
        max-height: 300px;
        overflow: hidden;
    }
    .container-wrapper {
        max-height: 300px;
        position: relative;
        overflow-y: auto;
        overflow-x: hidden;
        -ms-overflow-style: none; /* IE and Edge */
        scrollbar-width: none; /* Firefox */
    }
    .container-wrapper::-webkit-scrollbar {
        display: none;
    }
    .container {
        position: relative;
    }
</style>
