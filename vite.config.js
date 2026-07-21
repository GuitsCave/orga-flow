import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// A versão exibida no app vem daqui — para publicar uma nova, altere "version"
// no package.json. Não confundir com CURRENT_VERSION (formato dos dados salvos).
const pkg = JSON.parse(readFileSync('./package.json', 'utf8'))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
  },
})
