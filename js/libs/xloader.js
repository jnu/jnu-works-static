/**
 * Joe Nudell 2013
 */


(function(env) {

    var Loader = function() { };

    Loader.prototype = {
        options : {
            async : true,
            event : 'loaded',
            wait : false
        },
        //
        _listeners : {'loaded': []},
        _pending : [],
        //
        trigger : function(event) {
            if(this._listeners[event]) {
                for(var i=0; i<this._listeners[event].length; i++) {
                    this._listeners[event][i]();
                }
                return true;
            }
            return false;
        },
        //
        listenOnce : function(event, handler) {
            var that = this;
            this.addListener(event, function _oneOffHandler() {
                handler();
                that.removeListener(event, this);
            })
        },
        //
        addListener : function(event, handler) {
            if(!this._listeners[event]) this._listeners[event] = [];
            this._listeners[event].push(handler);
        },
        //
        removeListener : function(event, handler) {
            if(this._listeners[event]) {
                var listeners = this._listeners[event];
                for(var i=0; i<listeners.length; i++) {
                    if(String(handler)===String(listeners[i])) {
                        listeners.splice(i, 1);
                        return true;
                    }
                }
            }
            return false;
        },
        //
        loadFiles : function(files, options) {
            var that = this,
                files = typeof files==='object'? files : [files],
                options = typeof options==='undefined'? {} : options,
                loaded = 0,
                needed = 0,
                async = (options.async===undefined)? this.options.async : options.async,
                callback = options.callback || function() { return; },
                event = options.event || this.options.event,
                wait = options.wait || this.options.wait,
                now = ''+Date.now(),
                q = function(t) { return document.querySelector(t); },
                _final = function() {
                    // Everything is loaded; execute callback and delete this
                    // object.
                    that.trigger(event);

                    for(var i=0; i<that._pending.length; i++) {
                        // Remove pending transfer from queue
                        if(that._pending[i]===now) {
                            that._pending.splice(i, 1);
                        }
                    }

                    // Broadcast that batch load completed
                    that.trigger(now);

                    callback();
                };

            // Add transfer ID to pending transfers list
            this._pending.push(now);

            // Define recursive loader function
            function _loader(files) {
                if(!(files||[]).length) {
                    if(!needed) _final();
                    return;
                }
                // Create new element
                var newEl = null,
                    fileName = files.shift();

                if(/\.js$/.test(fileName)
                    || /\.js\?/.test(fileName)
                    || /^js!/.test(fileName)) {
                    if(!q('script[src="'+fileName+'"]')) {
                        // Load JS file only once
                        newEl = document.createElement('script');
                        newEl.setAttribute('type', 'text/javascript');
                        newEl.setAttribute('src', fileName);
                    }
                }else if(/\.css$/.test(fileName) || /^css!/.test(fileName)) {
                    if(!q('link[href="'+fileName+'"]')) {
                        // Load StyleSheet only once
                        newEl = document.createElement('link');
                        newEl.setAttribute('rel', 'stylesheet');
                        newEl.setAttribute('type', 'text/css');
                        newEl.setAttribute('href', fileName);
                    }
                }else{
                    // Unsupported type
                    console.warn("Loader: can't determine type of "+ fileName);
                }

                if(newEl!=null) {
                    newEl.addEventListener('load', function(e) {
                        // Listen to when this script is loaded
                        loaded++;

                        // Load synchronously (after previous script has been loaded)
                        if(!async) _loader(files);

                        if(loaded==needed) _final();
                    });

                    // Add script to page (which will issue its request)
                    needed++;
                    document.getElementsByTagName('head')[0].appendChild(newEl);
                }else{
                    // Script already loaded, so continue with synchronous recursion
                    if(!async) _loader(files);
                }

                // Load scripts asynchronously
                if(async) _loader(files);
            }

            // Dispatch _loader according to preferences
            if((!async||wait) && this._pending.length>1) {
                // Run later by subscribing to last pending transfer's load event
                var e = this._pending[this._pending.length-2];
                this.listenOnce(e, function() {
                    // Closure with all the right variables in scope
                    _loader(files);
                });
            }else{
                // Run now
                _loader(files);
            } 
        }
    }; // end of Loader.prototype


    // Inherit the prototype to emulate a callable object
    //Loader.prototype.loadFiles.prototype = Loader.prototype;


    // Install Loader on window
    window.loader = new Loader;

})(window);