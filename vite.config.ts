import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import dts from 'unplugin-dts/vite'
import { defineConfig } from 'vite'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ command, mode }) => {
  if (command === 'serve') {
    return {
      root: 'example',
      plugins: [vue()],
      resolve: {
        alias: {
          fluxforge: resolve(__dirname, 'src/index.ts'),
        },
      },
      server: {
        proxy: {
          '/upload': 'https://jsonplaceholder.typicode.com/posts/',
        },
      },
    }
  }

  if (mode === 'example') {
    return {
      root: 'example',
      plugins: [vue()],
      base: '/fluxforge/',
      build: {
        outDir: '../docs',
        emptyOutDir: true,
      },
      resolve: {
        alias: {
          fluxforge: resolve(__dirname, 'src/index.ts'),
        },
      },
    }
  }

  return {
    build: {
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        name: 'index',
        fileName: 'index',
      },
      target: 'es2015',
    },
    plugins: [
      dts({
        tsconfigPath: './tsconfig.app.json',
        include: ['env.d.ts', 'src/index.ts'],
      }),
    ],
  }
})
