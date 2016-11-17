;var _ = (function() {
    var fn = {};

    // Helpers
    function toArray(X){
        return Array.prototype.map.call(X, function(a){ return a; });
    }
    function slice(X, n, m) {
        return Array.prototype.slice.call(X, n, m);
    }



    // -- Functional features -------------------------------------- /

    fn.partial = function(f){
        return Function.prototype.bind.apply(f, toArray(arguments));
    };

    fn.autoCurry = function(f, nargs){
        nargs = nargs || f.length;
        return function() {
            if(arguments.length<nargs) {
                // Return partial
                return fn.partial.apply(f, [f].concat(toArray(arguments)));
            }else{
                return f(arguments);
            }
        }
    }



    // -- The startup mechanism ------------------------------------ /
    function caller(ƒ) {
        return function() {
            var args = [], f;
            if(typeof this.f=='function') {
                f = this.f;
                args = toArray(arguments);
            }else{
                f = arguments[0];
                args = toArray(arguments).slice(1);
            }
            return ƒ.apply(ƒ, [f].concat(args));
        }
    }

    function wrapper(f) { return new _(f); };

    function _(f){
        this.f = f;
    }

    _.prototype = {};
    Object.keys(fn).forEach(function(k){
        fn = caller(fn[k]);
        wrapper[k] = fn;
        _.prototype[k] = fn;
    });
    
    // Return callable
    return wrapper;
})();


