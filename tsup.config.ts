import { defineConfig } from 'tsup'

export default defineConfig([
    // Main library build
    {
        entry: {
            index: 'src/index.ts',
        },
        format: ['esm'],
        dts: true,
        sourcemap: true,
        clean: true,
        splitting: false,
        minify: true,
        external: ['usb', 'react', 'react-dom'],
        banner: {
            js: `/** */`,
        },
    },
])
