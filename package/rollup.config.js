import svelte from 'rollup-plugin-svelte'
import resolve from 'rollup-plugin-node-resolve'
import scss from 'rollup-plugin-scss'
import typescript from '@rollup/plugin-typescript'
import commonjs from '@rollup/plugin-commonjs'
import sveltePreprocess from 'svelte-preprocess'

export default {
    input: './src/index.ts',
    output: [
        {
            format: 'iife',
            file: './dist/index.js',
        },
    ],
    plugins: [
        svelte({
            preprocess: sveltePreprocess(),
        }),
        scss(),
        resolve({ browser: true }),
        commonjs(),
        typescript(),
    ],
}
