/**
 * A bucket of monkeypatches that alias various cross-browser functions
 * so they can be used transparently.
 */





(function() {
	
	var vendors = ['ms', 'moz', 'webkit', 'o'];
	
	
	
	// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
	// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
	 
	// requestAnimationFrame polyfill by Erik Möller
	// fixes from Paul Irish and Tino Zijdel
    var lastTime = 0;
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] 
                                   || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
 
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
 
    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };






	// getUserMedia shim
	// -jn
	for(var i=0; i<vendors.length && !navigator.getUserMedia; ++i) {
		navigator.getUserMedia = navigator[vendors[i]+'GetUserMedia'];
	}
	// Still might not be defined ... new feature




	// window.URL shim

	window.URL = window.URL || window.webkitURL;
})();
