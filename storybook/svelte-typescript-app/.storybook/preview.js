import ThemeLight from '../src/ThemeLight.svelte'
import ThemeDark from '../src/ThemeDark.svelte'

export const parameters = {
    backgrounds: { disable: true },
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
        matchers: {
            color: /(background|color)$/i,
            date: /Date$/,
        },
    },
}

export const decorators = [
    (StoryFn, context) => {
        return context.globals.theme === 'light' ? ThemeLight : ThemeDark
    },
]

export const globalTypes = {
    theme: {
        name: 'Theme',
        description: 'Global theme for components',
        defaultValue: 'light',
        toolbar: {
            // The icon for the toolbar item
            icon: 'circlehollow',
            // Array of options
            items: [
                { value: 'light', icon: 'circlehollow', title: 'light' },
                { value: 'dark', icon: 'circle', title: 'dark' },
            ],
            // Property that specifies if the name of the item will be displayed
            showName: true,
        },
    },
}
