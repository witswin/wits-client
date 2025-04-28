import { defineConfig } from 'tsup'
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill'

export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'dist',
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  minify: false,
  // @ts-ignore
  esbuildPlugins: [NodeModulesPolyfillPlugin({})],
  external: ['process']
})
