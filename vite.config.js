import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
import glsl from 'vite-plugin-glsl';

import zipPack from "vite-plugin-zip-pack";
import CleanCSS from 'vite-plugin-clean-css';
import { promises as fs } from 'fs';
import path from 'path';

export default defineConfig(({ command, mode }) => {

  if (command === 'serve') {
    return {

      plugins: [basicSsl(), glsl({
        minify: true
      })],

      resolve: {
        alias: {
        },
      },

      build: {
        sourcemap: true,
      },

      server: {

        host: 'localhost',
        host: true,

        open: true,
        port: 6000,

        watch: {
          usePolling: true,
          interval: 1000,
          ignored: [
            '**/node_modules/**',
            '**/.git/**',
            '**/dist/**'
          ]
        }
      },

      base: "/"
    }
  }
  else if (command === 'build') {
    return {

            base: '',
        build: {
          outDir: './dist',
          emptyOutDir: true,
          // sourcemap: true,
          minify: 'terser',
          terserOptions: {
            compress: {
              drop_console: true,
              drop_debugger: true,
              passes: 2,              
              toplevel: true,
     
            },
            mangle: {
              toplevel: true,
            },
            format: {
              comments: false,
            },
          },

          rollupOptions: {
            input: 'index.html',
            external: ['three', 'lil-gui'], 
            output: {
           
              codeSplitting: false,
              entryFileNames: `script.js`,
              chunkFileNames: `[name].js`,
              assetFileNames: `[name].[ext]`
            }
          },
          modulePreload: false,
          cssCodeSplit: false,        
          assetsInlineLimit: 0,       
        },
        publicDir: 'public',
        plugins: [
          basicSsl(), glsl({
        minify: true
      }),

          {
            name: 'clean-dist-zip',
            buildEnd: async () => {
              await deleteFolderContents('./dist-zip');
              console.log('dist-zip folder cleaned.');
            }
          },

          CleanCSS({ level: 2 }),

          zipPack({ filter: (file) => !file.includes('Thumbs.db') }),

        ],     
    }
  }
});


const deleteFolderContents = async (folderPath) => {
  try {
    const files = await fs.readdir(folderPath);
    for (const file of files) {
      const currentPath = path.join(folderPath, file);
      const stat = await fs.lstat(currentPath);
      if (stat.isDirectory()) {
        await deleteFolderContents(currentPath);
        await fs.rmdir(currentPath);
      } else {
        await fs.unlink(currentPath);
      }
    }
    console.log(`Contents of ${folderPath} deleted.`);
  } catch (err) {
    console.error(`Error deleting contents of ${folderPath}:`, err);
  }
}








