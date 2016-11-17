;(function ( $, window, document, undefined ) {


    // Create the defaults once
    var pluginName = "indicator",
        defaults = {
            borderRadius: "5px",
            downColor: "#E0401C",
            upColor: "#00A550",
            min: 0,
            max: 1,
            height: 10,
            width: 200,
            value: .5
        };

    // The actual plugin constructor
    function Plugin( element, options ) {
        this.element = element;

        // jQuery has an extend method which merges the contents of two or
        // more objects, storing the result in the first object. The first object
        // is generally empty as we don't want to alter the default options for
        // future instances of the plugin
        this.options = $.extend( {}, defaults, options );

        this._defaults = defaults;
        this._name = pluginName;

        this.init();
    }

    Plugin.prototype = {

        init: function() {
            // Place initialization logic here
            // You already have access to the DOM element and
            // the options via the instance, e.g. this.element
            // and this.options
            // you can add more functions like the one below and
            // call them like so: this.yourOtherFunction(this.element, this.options).
            var $el = $(this.element),
                html = "<div class='e-indicator'><span class='e-neg'></span><span class='e-pos'></span></div>",
                indicatorStyle = {
                    border: 'thin solid #333',
                    borderRadius: this.options.borderRadius,
                    position: 'relative',
                    left: 0,
                    width: this.options.width,
                    height: this.options.height
                },
                negStyle = {
                    backgroundColor: this.options.downColor,
                    margin: 0,
                    position: 'absolute',
                    right: "50%",
                    borderRight: 'thin solid #333',
                    width: 0,
                    height: this.options.height
                },
                posStyle = {
                    backgroundColor: this.options.upColor,
                    margin: 0,
                    position: 'absolute',
                    left: "50%",
                    borderLeft: 'thin solid #333',
                    width: 0,
                    height: this.options.height
                }

            $el.html(html);
            $el.width(this.options.width);
            $el.find('.e-indicator').css(indicatorStyle);
            $el.find('.e-neg').css(negStyle);
            $el.find('.e-pos').css(posStyle);

            return this;
        },

        max: function(val) {
            if(val===undefined) {
                return this.options.max;
            }
            this.options.max = val;
            return this;
        },

        min: function(val) {
            if(val===undefined) {
                return this.options.min;
            }
            this.options.min = val;
            return this;
        },

        value: function(val) {
            if(val===undefined) {
                return this.options.value;
            }
            var $el = $(this.element);

            this.options.value = val;
            var pct = ((this.options.value - this.options.min)/(this.options.max-this.options.min))-.5,
                width = +$el.find('.e-indicator').width(),
                w = width*pct

            if(pct>0) {
                // positive
                $el.find('.e-pos').width(w);
                $el.find('.e-neg').width(0);
            }else if(pct<.5){
                $el.find('.e-pos').width(0);
                $el.find('.e-neg').width(-w);
            }else{
                $el.find('.e-pos').width(0);
                $el.find('.e-neg').width(0);
            }

            return this;
        }
    };

    // A really lightweight plugin wrapper around the constructor,
    // preventing against multiple instantiations
    $.fn[pluginName] = function ( ) {
        var args = arguments;
        return this.each(function () {
            if (!$.data(this, "plugin_" + pluginName)) {
                $.data(this, "plugin_" + pluginName, new Plugin( this, args[0]||{} ));
            }else{
                // Plugin exists
                var _p = $.data(this, 'plugin_'+pluginName);
                if(args.length) {
                    // call function
                    _p[args[0]].call(_p, Array.prototype.slice.call(args, 1))
                }else{
                    return _p;
                }
            }
        });
    };

})( jQuery, window, document );