import { defineConfig } from 'tsup'
import type { Options } from 'tsup'
import type { Plugin, PluginBuild } from 'esbuild'

export default defineConfig((options): Options[] => {
  const commonOptions: Options = {
    entry: {
      'wits-client': 'src/index.ts',
      'wits-client.api-client-v1': 'src/api-client-v1.d.ts',
      'wits-client.api-client-v2': 'src/api-client-v2.d.ts',
      'wits-client.api-dashboard': 'src/api-dashboard.d.ts',
      'wits-client.config': 'src/config.ts',
      'wits-client.ws': 'src/ws/index.ts'
    },
    sourcemap: true,
    tsconfig: './tsconfig.json',
    ...options
  }

  return [
    // ESM build for general use
    {
      ...commonOptions,
      format: ['esm'],
      outExtension: () => ({ js: '.mjs' }),
      dts: true,
      clean: true,
      define: {
        'process.env.NODE_ENV': JSON.stringify('production')
      },
      external: ['events'] // Exclude 'events' from Node.js builds
    },
    // ESM build for legacy support
    {
      ...commonOptions,
      format: ['esm'],
      target: ['es2017'],
      dts: false,
      outExtension: () => ({ js: '.js' }),
      entry: { 'wits-client.legacy-esm': 'src/index.ts' },
      external: ['events'] // Exclude 'events' from Node.js builds
    },
    // Browser-specific bundle with polyfill for 'events'
    {
      ...commonOptions,
      entry: {
        'wits-client.browser': 'src/index.ts'
      },
      define: {
        'process.env.NODE_ENV': JSON.stringify('production')
      },
      format: ['esm'],
      outExtension: () => ({ js: '.mjs' }),
      minify: true,
      external: ['events'], // Externalize 'events'
      plugins: [
        {
          name: 'polyfill-events',
          setup(build: PluginBuild) {
            build.onResolve({ filter: /^events$/ }, () => {
              return { path: require.resolve('events') } // Polyfill events
            })
          }
        } as Plugin // Correctly typed plugin
      ]
    },
    // CommonJS build (for Node.js usage)
    {
      ...commonOptions,
      format: ['cjs'],
      outDir: './dist/cjs/',
      outExtension: () => ({ js: '.cjs' }),
      external: ['events'] // Exclude 'events' from Node.js builds
    }
  ]
})
