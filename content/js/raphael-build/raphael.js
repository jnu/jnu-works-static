// RequireJS - require-raphael Config

requirejs.config({
    //
    paths : {
        eve: 'eve',
        raphaelCore: 'raphael.core',
        raphaelSvg: 'raphael.svg',
        raphaelVml: 'raphael.vml',
        raphael: 'raphael.amd',

    },
    shim: {
        raphael: {
            exports: 'Raphael'
        }
    }
});


require(['raphael'],function(){});