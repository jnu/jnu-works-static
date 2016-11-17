(function(env){

function Utils() {};

Utils.prototype = { 


    encode : function(string, seed) {
        // Simple encoding of a string, for simple source obfuscation
        if(seed===undefined) seed = 1;
        var e = "",
            c = string.length,
            n = 0;
        for(var i=0; i<string.length; i++) {
            x = -(seed - i + c);
            n = string.charCodeAt(i) - x;
            while(n<0) n += 256;
            n %= 256;
            e += String.fromCharCode(n);
        }
        return e;
    },


    decode : function(string, seed) {
        // Decoding of jn.encode
        if(seed===undefined) seed = 1;
        var d = "",
            c = string.length,
            n = 0;
        for(var i=0; i<string.length; i++) {
            x = -(seed - i + c);
            n = string.charCodeAt(i) + x;
            n %= 256;
            d += String.fromCharCode(n);
        }
        return d;
    }

};


env.utils = new Utils;

})(window);