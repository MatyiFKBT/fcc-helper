import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';
import { author, name } from './package.json';
export default defineConfig({
  plugins: [
    monkey({
      entry: 'src/main.ts',
      userscript: {
        icon: 'https://www.freecodecamp.org/favicon-32x32.png',
        namespace: 'matyifkbt/fcc-helper',
        match: ['https://www.freecodecamp.org/*'],
        version: `v${new Date().getTime()}`,
        downloadURL: `https://github.com/${author.name}/${name}/releases/download/latest/index.user.js`,
        updateURL: `https://github.com/${author.name}/${name}/releases/download/latest/index.meta.js`,
      },
    }),
  ],
});
