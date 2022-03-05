const mix = require('laravel-mix');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

mix.webpackConfig({
    plugins: [
        new NodePolyfillPlugin({
            excludeAliases: ['console']
        })
    ]
});

mix.js('resources/js/main.js', 'public/js')
    .sass('resources/sass/app.scss', 'public/css')
    .vue()
    .version();

//mix.js('resources/js/main.js', 'public/js')
    //.postCss('resources/css/app.css', 'public/css', [
        //require('tailwindcss'),
    //])
    //.vue()
    //.version();
