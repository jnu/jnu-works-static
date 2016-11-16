// Some helpers ... load via bookmarklet



(function(context) {
    var exports = context.j = context.j || {};

    // Patch console timers
    var console = context.console;
    var timers;

    if (console && !console.time) {
        timers = {};

        console.time = function(label) {
            timers[label] = Date.now();
        };

        console.timeEnd = function(label) {
            var endTime = Date.now();

            if (Object.prototype.hasOwnProperty.call(timers, label)) {
                var delta = endTime - timers[label];
                log(label + ': ' + delta + 'ms');
                delete timers[label];
            }
        };
    }



    // unify events

    exports.unifyEvents = function(el, evt) {
        var obj = $._data(el, 'events')[evt];
        var handlers = obj.map(function(o) {
            return o.originalHandler || o.handler;
        });

        var unifiedHandler = function(e) {
            handlers.forEach(function(f, i) {
                console.log("Excecuting handler " + i);
                f(e);
                console.log("Done executing handler " + i);
            });
        };

        $(el)
            .off(evt)
            .on(evt, _.debounce(unifiedHandler, 300));
    };


}(window));

