(function(Underscore) {
	var utils = {
		proxy : function(source, target) {
			// proxy methods to target from source
			var methods = _.rest(arguments, 2) || _.functions(source);
			methods.forEach(function(method) {
				if (!target[method]) {
					target[method] = function() {
						return source[method].apply(source, arguments);
					};
				}
			});
		},

		noop : function() { /* no-op */ }
	};

	Underscore.mixin(utils);
})(_);