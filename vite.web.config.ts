import { defineConfig } from 'vite'

export default defineConfig({
    root: 'examples/web',
    build: {
        outDir: '../../dist-web',
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: 'examples/web/index.html',
            },
        },
    },
    server: {
        port: 3000,
        open: true,
    },
    optimizeDeps: {
        exclude: ['@jpglab/fuse'],
    },
})
