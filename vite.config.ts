import { defineConfig, type Plugin } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { montraAliases, montraAppFor, montraAppStyles, type MontraAppId } from './montra.aliases.ts'

const APP_NAMES: Record<MontraAppId, string> = {
  credit: 'Montra Credit',
  lawyer: 'Montra Lawyer',
  stock: 'Montra Stock Credit',
  factoring: 'Montra Factoring',
  customer: 'Montra Customer',
}

/** index.html <title> for the app being run (the page then keeps it updated, see useAppFavicon) */
const appTitle = (app: MontraAppId): Plugin => ({
  name: 'montra-app-title',
  transformIndexHtml: (html) => html.replace(/<title>.*<\/title>/, `<title>${APP_NAMES[app]}</title>`),
})

// https://vite.dev/config/
// One Vite project, one Montra app per run: `vite` = Credit, `vite --mode lawyer` = Lawyer,
// `vite --mode stock` = Stock Credit, `vite --mode factoring` = Factoring,
// `vite --mode customer` = Customer.
export default defineConfig(({ mode }) => {
  const app = montraAppFor(mode)
  return {
    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] }),
      appTitle(app),
    ],
    resolve: {
      alias: montraAliases(app),
    },
    css: {
      preprocessorOptions: {
        scss: {
          loadPaths: [montraAppStyles(app)],
          // Bootstrap 5 and our partials still use @import and the global Sass functions:
          // mute Dart Sass's deprecation warnings until the move to @use (Dart Sass 3)
          quietDeps: true,
          silenceDeprecations: ['import', 'global-builtin', 'color-functions', 'if-function'],
        },
      },
    },
    // One dependency cache per app: apps running side by side (npm run dev, dev:lawyer, …) would
    // otherwise re-optimize the shared cache for their own config and break each other ("504 Outdated Optimize Dep")
    cacheDir: `node_modules/.vite/${app}`,
    build: {
      outDir: `dist/${app}`,
    },
  }
})
