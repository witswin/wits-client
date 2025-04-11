import type { Options } from 'tsup'
import { defineConfig } from 'tsup'

// const mangleErrorsTransform: Plugin = {
//   name: mangleErrorsPlugin.name,
//   setup(build) {
//     const { onTransform } = getBuildExtensions(build, mangleErrorsPlugin.name)

//     onTransform({ loaders: ["ts", "tsx"] }, async (args) => {
//       try {
//         const res = await babel.transformAsync(args.code, {
//           parserOpts: {
//             plugins: ["typescript"],
//           },
//           plugins: [
//             [
//               mangleErrorsPlugin,
//               { minify: false } satisfies MangleErrorsPluginOptions,
//             ],
//           ],
//         })

//         if (res == null) {
//           throw new Error("Babel transformAsync returned null")
//         }

//         return {
//           code: res.code!,
//           map: res.map!,
//         }
//       } catch (err) {
//         console.error("Babel mangleErrors error: ", err)
//         return null
//       }
//     })
//   },
// }

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
    {
      ...commonOptions,
      format: ['esm'],
      outExtension: () => ({ js: '.mjs' }),
      dts: true,
      clean: true
    },
    {
      ...commonOptions,
      format: ['esm'],
      target: ['es2017'],
      dts: false,
      outExtension: () => ({ js: '.js' }),
      entry: { 'wits-client.legacy-esm': 'src/index.ts' }
    },
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
      minify: true
    },
    {
      ...commonOptions,
      format: ['cjs'],
      outDir: './dist/cjs/',
      outExtension: () => ({ js: '.cjs' })
    }
  ]
})
