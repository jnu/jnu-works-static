var jn = jn || {};

jn.SynIEChart = function() {
	return {
		// aliases
		$ 					: jQuery,
		// selections vars
		force				: {},
		svg					: {},
		circle				: {},
		links				: {},
		nodeLabels			: {},
		groupLabels    		: {},
		defText				: {},
		// objects
		nodes				: [],
		edges				: [],
		labels				: [],
		roots           	: [],
		words				: [],
		// other variables
		groups				: 0,
		gravity				: null,
		charge				: null,
		// default settings
		infoWidth			: 400,
		width 				: 500,
		height 				: 500,
		cache				: false,
		cachedJSON			: {},
		canvasColor			: '#eee',
		extraClass			: "extranode",
		coreClass			: "corenode",
		linkClass			: "link",
		circleClass			: "circle",
		labelClass			: "label",
		rootLabelClass  	: "rootLabel",
		defTextClass        : "definition",
		radius				: 15,
		defaultGravity 		: 0.1,
		defaultCharge   	: -100,
		defaultLinkDistance : 100,
		defaultLinkStrength : .5,
		color 				: d3.scale.category20(),
		inactiveColor		: '#bbb',
		labelColor			: '#000',
		inactiveLabelColor 	: '#bbb',
		// InfoPanel vars
		infoPadding			: { x: 10, y: 10 },
		// spacing vars
		centers 			: [],
		coreLength			: 0,
		meaningNode			: {name  : "meaning",
		             		   fixed : true,
							   data  : {type: "defText", group: null}},
		baseURL				: '/sandbox/ss/synie.php?m=',
		//
		//
		//
		// METHODS
		//
		//
		//
		ready: function(callback) {
			return this.init(callback);
		},
		//
		//
		//
		init: function (callback) {
			var that = this;
			// Add widget HTML, call load_data() to init all the dynamic stuff.
			var html = '<a name="jnchart"></a><div id="chart"></div><div id="dash"><p id="words"></p></div>';
			$('#jn-widgetcontainer').html(html);
			
			this.svg = d3.select("#chart").append("svg")
										  .style("fill", this.canvasColor)
										  .attr("width", this.width+this.infoWidth)
										  .attr("height", this.height);
			
			return this.load_data(callback);
		},
		//
		//
		//
		load_data: function (callback) {
			var that = this;
			$.getJSON('/sandbox/ss/synie.php?x=meta', function(json) {
				$.each(json.words, function() {
					that.words.push(this);
					$('#words').append($("<a />").attr('id', this.replace(/[^\w\d]/g, '')).attr('href', '#jnchart').text(this));
				});
				that.nodes = json.nodes;
				that.coreLength = json.coreLength;
				if(that.cache) {
					return that.cacheData(function() { return that.init_graph(callback); });
				}else{
					return that.init_graph(callback);
				}
			});
		},
		//
		//
		//
		cacheData: function(callback) {
			var that = this;
			function _loadWords(words) {
				if(words.length<1) return callback();
				var word = words.pop();
				$.getJSON(that.baseURL + 'concept' + '&w=' + word, function(data) {
					that.cachedJSON[word] = data;
					return _loadWords(words);
				});
			}
			return _loadWords(this.words);
		},
		//
		//
		//
		init_graph: function (callback) {
			var that = this;
		
			// Add node groups to SVG
			this.circle = this.svg.selectAll("g."+this.coreClass).data(this.nodes);
			this.circle.enter().append("svg:g")
							   .attr("class", this.coreClass);
							   
			// arrange labels for core circles	
			this.labels = [];
			for(var i=0; i<this.nodes.length; i++) {
				this.labels.push({anchor: i,
								  name  : this.nodes[i].name});
			}

			this.circle.append("svg:text")
					   .attr("class", this.labelClass)
					   .attr("style", "font-size: .7em; text-anchor: middle;")
					   .style("fill", this.labelColor)
					   .text(function (d) { return d.name; });
					   
					   
			// Add Circles
			this.circle.insert("svg:circle", ":first-child")
			           .attr("class", this.coreClass)
					   .attr("r", this.radius);		   
					
			// Add labels
			this.circle.append("title")
					   .text(function(d) { return d.meta.fullname; });   
		 
		 
		 	// Add "Meaning" node
		 	this.defText = this.svg.selectAll("text."+this.defTextClass).data([this.meaningNode]);
			this.defText.enter().append("svg:text").attr("class", this.defTextClass).attr("style", "font-size: 2em; text-anchor: middle;");
		 
			this.start();
			if(callback) {
				return callback();
			}
		},
		//
		//
		//
		start: function(callback) {
			var that = this;
			
			var allNodes = this.nodes;
			allNodes.push(this.meaningNode);
			
			this.force = d3.layout.force()
								  .links(this.edges)
								  .nodes(allNodes)
								  .size([this.width, this.height]);
			this.circle.call(this.force.drag);
		},
		//
		//
		//
		// FORCES
		//
		//
		//
		changeWord: function(word) {
			var that = this;
			
			this.loadNodes(word, function() {
				that.centers = that.inscribePolygon(that.groups);
				that.placeGroupLabels();
				that.force
					.gravity(that.defaultGravity)
					.charge(function(e) {
						if( e.data && e.data.type=='defText' ) {
							return -400;
						}else{
							return that.defaultCharge;
						}
					})
					.linkDistance(that.defaultLinkDistance)
					.linkStrength(that.defaultLinkStrength)
					.friction(0.9)
					.on("tick", function (e) {
						that.links
							.attr("x1", function(d) { return d.source.x; })
							.attr("y1", function(d) { return d.source.y; })
							.attr("x2", function(d) { return d.target.x; })
							.attr("y2", function(d) { return d.target.y; });
						
						that.defText
							.each(function(d) {
								d.x = that.width/2;
								d.y = that.height/2;
							})
							.attr("transform", function(d) {return "translate("+ d.x +","+ d.y +")"});
						
						that.circle
							.each(that.centerGroups(e.alpha, word))
							.attr("transform", function (d) { return "translate("+ d.x +","+ d.y +")"; });
					})
					.start();
			});
		},
		//
		//
		//
		// SORTING
		//
		//
		//
		centerGroups: function(alpha, word) {
			var that = this;
			return function(d){
				var center = (d.data.group)? that.centers[d.data.group] : {x: that.width/2, y: that.height/2};
				var tX = center.x;
				var tY = center.y;
				d.x = d.x + (tX - d.x) * (that.defaultGravity - .05) * alpha
				d.y = d.y + (tY - d.y) * (that.defaultGravity - .05) * alpha
			};
		},
		//
		//
		//
		// HELPER FUNCTIONS
		//
		//
		//
		inscribePolygon: function(n) {
			// n = number of sides of polygon.
			// Return coordinates of positions of verteces of polygon
			// inscribed in current canvas
			if( n<1 ) {
				return {x:0, y:0};
			}
			var coords = [],
				rx = this.width / 2,
				ry = this.height / 2 ,
				theta = 2 * Math.PI / n;
			if(n==1) {
				// special case: return center
				coords.push({ x: rx, y: ry});
				return coords;
			}
			for(var i=0; i<n; i++) {
  				coords.push({ x: rx + (rx * Math.cos(i * theta) ),
							  y: ry - (ry * Math.sin(i * theta)) });
			}
			return coords;
		},		
		//
		//
		//
		placeGroupLabels: function() {
			var that = this;
			this.roots = [];
			for(var i=0; i<this.nodes.length; i++) {
				this.roots[this.nodes[i].data.group] = {root  : this.nodes[i].data.PIEroot,
												        group : this.nodes[i].data.group}; 
			}
									   	
			this.groupLabels = this.svg.selectAll("text." + this.rootLabelClass).data(this.roots);
			this.groupLabels.enter().append("svg:text")
									.attr("style", "font-size: 1em;")
									.attr("class", this.rootLabelClass)
									.style("fill", this.canvasColor)
									.attr("transform", function(d) {
										var dx = that.width + that.infoPadding.x,
											dy = (1 + d.group) * (15 + that.infoPadding.y);
										return "translate("+ dx +","+ dy +")";
									})
									.on("mouseover", function(d1) {
										that.circle
											.style("fill", function(d2) {
												if(d2.data.group==d1.group) {
													return that.color(d1.group);
												}else{
													return that.inactiveColor;
												}
											})
											.attr("inactive", "true");
										that.force.resume();
									})
									.on("mouseout", function(d1) {
										that.circle
											.style("fill", function(d2) {
												return that.color(d2.data.group);
											})
											.attr("inactive", "false");
										that.force.resume();
									});
			this.groupLabels.exit()
					.transition()
					.style("fill", this.canvasColor)
					.remove();
			
			// Set text for ALL labels (not just newly entering labels)
			this.groupLabels.text(function(d) {
				var rootText = "";
				for(var i in d.root) {
					if(d.root[i].origin==null || d.root[i].attested==null || d.root[i].root==null) {
						return "Unknown";
					}
					rootText += (rootText.length>0)? "; " : "";
					rootText += d.root[i].origin;
					rootText += (d.root[i].attested)? " " : " *";
					rootText += d.root[i].root + " '" + d.root[i].meaning + "'";
				}
				return rootText;
			});				
			
			// Set transitions
			this.groupLabels.transition()
							.style("fill", function(d) {
								return that.color(d.group);
							});
		},	
		//
		//
		//
		loadNodes: function(word, callback) {
			var that = this;
			// Init dynamic widget stuff with jQuery(UI)
			function _loadNewData(json) {
				//that.updateCoreNodes(json.nodes.slice(0, that.coreLength));
				that.nodes = json.nodes;
				that.edges = json.edges;
				that.groups = json.meta.groups;
				
				// Add links
				that.links = that.svg.selectAll("line."+that.linkClass).data(that.edges);
				that.links.enter().insert("svg:line", ":first-child")
								  .attr("class", that.linkClass)
				that.links.exit().remove();
				
				// Add nodes
				that.circle = that.svg.selectAll("g").data(that.nodes);
				that.circle.enter().append("svg:g")
							       .attr("class", that.extraClass)
								   .append("circle")
								   .attr("class", that.extraClass)
							       .attr("r", that.radius)
								   .append("title")
								   .text(function(d) { return (d.meta)? d.meta.fullname : ""; });
				that.circle.transition().style("fill", function(d) { return that.color(d.data.group); });
				that.circle.exit().transition().style("fill", that.canvasColor).remove();
				
				// Start
				that.start();
				// add mouse events to circle
				that.circle
					.on("mouseover", function(d) {
						// Show middle text
						that.defText.text(function (e) { return d.data.sign; });
						that.defText.style("fill", function (e) { return that.color(d.data.group); });
						
						// Highlight relevant root
						that.groupLabels.style("fill", function(d1) {
							if(d1.group==d.data.group) {
								return that.color(d1.group);
							}else{
								return that.inactiveColor;
							}
						})
						
						// start simulation so nodes get out of the way of text
						that.force.resume();
					})
					.on("mouseout", function(d) {
						that.defText.style("fill", that.canvasColor);
						that.defText.text("");
						// re-highlight all roots
						that.groupLabels.style("fill", function(d1) { return that.color(d1.group); });
						that.force.resume();
					});
				return callback();
			}
			
			// If cache was set to true, get data from there, not server
			if(this.cache) {
				// Important that the array is copied and not passed directly. Otherwise
				// unpredictable results will obtain.
				var cached_array = $.extend(true, {}, this.cachedJSON[word]);
				_loadNewData(cached_array);
			}else{
				var url = this.baseURL + 'concept' + '&w=' + word;
				$.getJSON(url, _loadNewData)
			}
		}
	};
}





// WP Widget Init function
// (Call this code from wordpress post to set up widget)
jn.PIEWidgetI = function () {
	var chart = new jn.SynIEChart();
	chart.cache = true;
	chart.ready(function() {
		$('#words a').click(function(e) {
			$(this).addClass('active');
			$(this).siblings('a').removeClass('active');
			var curword = $(this).text();
			chart.changeWord(curword);
            e.preventDefault();
		});
		$('#words a:first-child').trigger("click");
	});
	return chart;
}
