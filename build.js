const { sassPlugin } =  require('esbuild-sass-plugin');

require('esbuild').build({
  entryPoints: [
    './src/main.ts',
  ],
  bundle: true,
  watch: true, //process.env['dev'] === '1' ? true : false,
  outfile: './build/main.js',
  plugins: [
    sassPlugin({
      type: 'css',
    }),
  ],
});
