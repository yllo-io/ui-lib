module.exports = {
  stories: [
    "../src/**/*.stories.mdx",
    "../src/**/*.stories.@(js|jsx|ts|tsx|svelte)",
  ],
  staticDirs: ["../public"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-svelte-csf",
  ],
  framework: "@storybook/svelte",
  svelteOptions: {
    preprocess: require("svelte-preprocess")(),
  },
};
