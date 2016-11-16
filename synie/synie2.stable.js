/**
 * synie2.stable.js
 *
 * Indo-European Etymology and Cognate Explorer
 * Version 2.0, stable.
 *
 * USAGE
 * Populates an element with the id #jn-widgetcontainer in the body of the page.
 * To start, call jn.widget().
 *
 * REQUIRES
 * Client-side: jQuery, jQueryUI, d3, and d3.sankey
 * Server-Side: synie.php and accompanying databases
 *
 * AUTHOR
 * Copyright (c) 2013 Joseph Nudell
 * Released under the MIT License (http://opensource.org/licenses/MIT)
 */


var jn = jn || {};

jn.LastSliceChart = function() {
	return {
		// aliases
		$ 					: jQuery,
		// selections vars
		force				: {},
		svg					: {},
		links				: {},
		nodeLabels			: {},
		groupLabels    		: {},
		defText				: {},
		selectedRoot		: {},
		sankey				: {},
		sankeyPath			: {},
		sGeneticLink		: {},
		sContactLink		: {},
		sAllNode			: {},
		// objects
		nodes				: [],
		edges				: [],
		labels				: [],
		roots           	: [],
		allRoots			: [],
		words				: [],
		geneticLinks		: [],
		contactLinks		: [],
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
		canvasColor			: '#FCFBF5',
		extraClass			: "extranode",
		coreClass			: "corenode",
		nodeClass			: "node",
		linkClass			: "link",
		circleClass			: "circle",
		labelClass			: "label",
		treeNodeClass		: "treenode",
		rootLabelClass  	: "rootLabel",
		defTextClass        : "definition",
		defTextStyle		: "font-size: 2em; text-anchor: middle;",
		treeLinkClass		: "treelink",
		geneticLinkClass	: "genlink",
		contactLinkClass	: "conlink",
		radius				: 15,
		sankeyTitlePadding	: 20,
		defaultGravity 		: 0.1,
		defaultAlpha		: .2,
		defaultCharge   	: -100,
		defaultLinkDistance : 100,
		defaultLinkStrength : .5,
		geneticLinkWeight	: 1,
		contactLinkWeight	: .1,
		color 				: d3.scale.category20(),
		inactiveColor		: '#bbb',
		labelColor			: '#000',
		inactiveLabelColor 	: '#bbb',
		// InfoPanel vars
		infoPadding			: { x: 10, y: 10 },
		// spacing vars
		centers 			: [],
		nodePadding 		: 10,
		coreLength			: 0,
		meaningNode			: {name  : "meaning",
		             		   fixed : true,
							   data  : {type: "defText", group: null}},
		baseURL				: '/sandbox/ss/multiget.php',
		singURL				: '/sandbox/ss/synie.php?m=',
		// control
		forceStopped		: false,
		sankeyShowing		: false,
		animationLock		: false,
		// Lookup tables
		buckLookup			: {
			Grk : 'grc', NG  : 'ell', Lat : 'lat', It  : 'ita', Fr  : 'fra',
			Sp  : 'spa', Rum : 'ron', Ir  : 'sga', NIr : 'gle', W   : 'cym',
			Br  : 'bre', Goth: 'got', ON  : 'non', Dan : 'dan', Sw  : 'swe',
			OE  : 'ang', ME  : 'enm', NE  : 'eng', Du  : 'nld', OHG : 'goh',
			MHG : 'gmh', NHG : 'deu', Lith: 'lit', Lett: 'lvs', ChSl: 'chu',
			SCr : 'hbs', Boh : 'ces', Pol : 'pol', Russ: 'rus', Skt : 'san',
			Av  : 'ave', Alb : 'sqi'
		},
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
			$('#dash').hide(); // hide dashboard
			
			// Display loading screen.
			// Todo: Loading screen should just show animated GIF; progress bar is useless now that requests
			// are bundled and performed server-side.
			var cont = $("<div id='jn-loading-cont'><p><br/>Baking PIE.</p><p>(Clearly you're short on fiber.)</p></div>")
				.css({
					'z-index': 998,
					'position': 'relative',
					'left': '0px',
					'top': '0px', 
					'width': that.width+that.infoWidth+"px",
					'height': that.height+"px",
					'text-align': 'center',
					'background-attachment': 'fixed'
				})
				.append($('<div id="jn-loading"/>')
					.css({
						'z-index': 999,
						 'position': 'absolute',
						 'top': that.height/2+"px",
						 'left': '35%',
						 'width': '30%',
						 'text-anchor': 'middle'}
						)
						.append($('<img src="/sandbox/img/loadpie.gif" />')));
						  
		
			$('#jn-widgetcontainer').append(cont);
			
			return this.loadData(callback);
		},
		//
		//
		//
		loadData: function (callback) {
			var that = this;
			var synieRequest = { 'tree' : 'source:synie,x:treedata',
							     'meta' : 'source:synie,x:meta' };
			$.post(this.baseURL, synieRequest, function(data) {
				var json = $.parseJSON(data),
					meta = json['meta'],
					tree = json['tree'],
					linkCounter = 0;
				$.each(meta.words, function() {
					that.words.push(this);
					if(that.words.length % 4 == 0) $('#words').append($('<br />'));
					$('#words').append($("<a />").attr('id', this.replace(/[^\w\d]/g, '')).attr('href', '#jnchart').text(this));
				});
				that.allRoots = meta.roots;
				that.nodes = meta.nodes;
				that.coreLength = meta.coreLength;
				
				// Tree is loaded into cache REGARDLESS of whether that.cache is true!
				that.cachedJSON['tree'] = tree;
				
				// Load other data into cache if so configured, then move on to initializing graph
				if(that.cache) {
					return that.cacheData(function() { return that.initGraph(callback); });
				}else{
					return that.initGraph(callback);
				}
			});
		},
		//
		//
		//
		cacheData: function(callback) {
			var that = this;
			// Load all data into cache for better performance / to limit server requests
			
			// Recurse routines to load JSON serially via AJAX
			var otherIsFinished = false,
				requestData = {},
				_getData = function (words, roots) {
					// --- Load Words ---
					while(words.length) {
						word = words.pop();
						requestData[word] = "source:synie,m:concept,w:" + word;
					}
					// Execute request
					$.post(that.baseURL, requestData, function(data) {
						var json = $.parseJSON(data);
						for(var word in json) {
							that.cachedJSON['words'][word] = json[word];
						}
						// Resolve race condition with other request for callback calling
						if(otherIsFinished) return callback();
						else otherIsFinished = true;
					});
					
					// --- Load roots ---
					// Will happen before response is received about words from server!
					requestData = {};
					while(roots.length) {
						var root = roots.pop();
						requestData[root.root] = "source:synie,m:root,w:" + root.root;
					}
					$.post(that.baseURL, requestData, function(data) {
						var json = $.parseJSON(data);
						for(root in json) {
							that.cachedJSON['roots'][root] = json[root];
						}
						// Resolve race condition with `words` request callback
						if(otherIsFinished) return callback();
						else otherIsFinished = true;
					});
				};
			this.cachedJSON['words'] = {};
			this.cachedJSON['roots'] = {};
			
			// Load data with parallel AJAX requests
			return _getData(this.words, this.allRoots);
		},
		//
		//
		//
		initGraph: function (callback) {
			var that = this;
			// All done loading. Fade out loading screen.
			// Hide modal, show dashboard, and return callback.
			$('#jn-loading-cont').fadeOut('fast', function() {
				$('#dash').fadeIn('slow');
			});
			this.svg = d3.select("#chart")
				.append("svg")
				.style("fill", this.canvasColor)
				.attr("width", this.width+this.infoWidth)
				.attr("height", this.height);
		
			// Add node groups to SVG
			this.sAllNode = this.svg.selectAll('.'+this.nodeClass)
				.data(this.nodes);
			this.sAllNode
				.enter()
					.append("g")
						.attr("class", this.nodeClass);
			this.sAllNode
				.append('circle')
					.attr('r', this.radius);
			this.sAllNode
				.append('text')
					.attr("class", this.labelClass)
					.attr("style", "font-size: .7em; text-anchor: middle;")
					.style("fill", this.labelColor)
					.text(function (d) { return d.name; });
			this.sAllNode
				.append("title")
					.text(function(d) { return d.meta.fullname; });   
		 
		 	// Add "Meaning" node
		 	this.defText = this.svg.selectAll("text."+this.defTextClass)
				.data([this.meaningNode])
			.enter()
				.append("svg:text")
				.attr("class", this.defTextClass)
				.attr("style", this.defTextStyle);
				
			
			// Set up Sankey diagram in background for future use.
			this.sankey = d3.sankey()
				.nodeWidth(this.radius)
				.nodePadding(this.nodePadding)
				.size([this.width+this.infoWidth, this.height-this.sankeyTitlePadding]);
			this.sankeyPath = this.sankey.link();
			
			if(callback) return callback();
		},
		//
		//
		//
		start: function(callback) {
			var that = this;
			
			this.nodes.push(this.meaningNode);
			
			this.force = d3.layout.force()
				.links(this.edges)
				.nodes(this.nodes)
				.size([this.width, this.height]);
			this.sAllNode.call(this.force.drag);
			
			this.force.alpha(that.defaultAlpha);
			
			// Unlock "tick" event handler
			if(this.forceStopped) this.forceStopped = false;
		},
		//
		//
		//
		stop: function(callback) {
			// Helper function to disable force graph
			// There is apparently a bug in d3.layout.force that causes
			// the layout to tick sometimes even when the alpha is manually
			// set to a negative value, and even when force.stop() is called.
			// A workaround is to set a global variable (this.forceStopped, for
			// example) that can be checked in the "tick" event handler, which
			// can be inhibited appropriately. See the "tick" event handler for
			// the force below in this.changeWord() for a demonstration. -- JN
			var that = this;
			this.force.alpha(-1);
			if(!this.forceStopped) this.forceStopped = true;
			if(callback!==undefined) return callback();
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
			this.animationLock = false;
			this.loadNodes(word, function(timeout) {
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
						// Can't tell if it's a bug in d3 or a phantom somewhere in my code,
						// but for whatever reason when the Sankey is displayed, even after
						// force.stop() is called, the force keeps on ticking. That means Sankey
						// and Force are competing to lay out the nodes, which is obviously problematic.
						// The solution is to simply set the global .forceStopped to true when Sankey
						// is in control, and to ignore any ticks that occur when Sankey is laying out
						// the nodes. Couldn't find a more elegant solution as of 12/5 -- JN.
						if(that.forceStopped) return;
						
						// Reposition the graph on tick.
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
						
						that.sAllNode
							.each(that.centerGroups(e.alpha, word))
							.attr("transform", function (d) { return "translate("+ d.x +","+ d.y +")"; });
					})
					.start();
			});
		},
		//
		//
		//
		// LAYOUT BY ROOTS
		//
		//
		//
		clickedRoot: function(root) {
			var that = this;
			// Move root to top of screen, load children, set layout
			this.loadRoots(root, function() {
				// Simple transition to place root in the top of the screen
				that.groupLabels
					.transition()
					.attr("transform",
						  "translate(20,20)")
					.duration(500);
				
				// Create Sankey diagram -- update nodes and links
				that.updateNodesForSankey();
				
				// Hide force graph, make room for PIE tree
				that.clearForceGraph();
				
				// -- Do complicated layout stuff for languages --//
				
				// -- Create Nodes -- //
				// Create list of ALL links, genetic + contact
				var allLinks = that.geneticLinks.concat(that.contactLinks);
				that.sankey
					.nodes(that.nodes)
					.links(allLinks)
					.layout(32);
				
				// Create nodes in Sankey Diagram. These are rectangles.
				that.sAllNode = that.svg.selectAll('g.'+that.nodeClass)
					.data(that.nodes, function(d) { return d.name; });
	
				that.sAllNode.exit()
					.transition()
						.attr('transform', 'translate(-100, -100)')
					.duration(500)
					.remove();
				
				// Mark existing nodes that will need rectangles (they are currently circles)
				that.sAllNode
					.attr('class', function(d) {
						return that.sankeyNodeClassString(d, that.nodeClass +' '+ that.treeNodeClass +' needsrectangle');
					})
					.style('opacity', null);
				
				// Entry of new rectangle nodes. Give them rectangles
				that.sAllNode
					.enter()
						.append("g")
							.attr("class", function(d) {
								return that.sankeyNodeClassString(d, that.nodeClass +' '+ that.treeNodeClass + ' newnode');
							})
							.append('rect')
								.attr("height", function(d) { return d.dy; })
								.attr("width", that.sankey.nodeWidth())
								.style('opacity', 0);
								
				// Add invisible rectangles, but make them same dimension as circles
				that.svg.selectAll('.needsrectangle')
					.append('rect')
						.attr('height', that.radius)
						.attr('width', that.radius)
						//.attr("height", function(d) { return d.dy; })
						//.attr("width", that.sankey.nodeWidth())
						.style('opacity', 0);
						
				// Place invisible screen on top of canvas to block mouse events from interrupting
				that.svg.append('svg:rect')
					.attr('class', 'screen')
					.style('opacity', '0')
					.attr('width', that.width+that.infoWidth)
					.attr('height', that.height);
				
				that.svg.selectAll('.needsrectangle')
					.each(function() {
						// Transfer current coloring to the circle only,
						// so that class colors can be applied to the containing group
						// and the animation is not so jarring
						var me = d3.select(this);
						me.style('inactive', false);
						me.selectAll('circle')
							.style('fill', me.style('fill'));
						me.style('fill', null);
					})
					.attr('class', function(d) {
						return that.sankeyNodeClassString(d, that.nodeClass +' '+ that.treeNodeClass +' oldnode');
					});	
				
				// First move old nodes in to place, and simultaneously turn them into squares
				that.svg.selectAll('.oldnode')
					.transition()
						.attr('transform', function(d) { return "translate(" + d.x + "," + d.y +")"; })
					.duration(750)
					.delay(250);
				that.svg.selectAll('.oldnode circle')
					.transition()
						.style('opacity', 0)
					.duration(750)
					.delay(250)
					.each('end', function() { d3.select(this).remove(); });
				that.svg.selectAll('.oldnode text')
					.transition()
						.style('opacity', 0)
					.duration(750)
					.delay(250)
					.each('end', function() {
						var p = this.parentNode;
						d3.select(this).remove();
						d3.select(p).select('rect').each(showSankeyNodeLabel);
					});
				that.svg.selectAll('.oldnode rect')
					.transition()
						.style('opacity', 1)
					.duration(750)
					.delay(250)
					.each('end', function() {
						d3.select(this)
							.transition()
								.attr('width', that.sankey.nodeWidth())
							.duration(500);
						d3.select(this)
							.transition()
								.attr('height', function(d) { return d.dy; })
							.duration(500);
					});
				
				// Then move new nodes into place
				that.svg.selectAll('.newnode')
					.transition()
						.attr('transform', function(d) { return "translate(" + d.x + "," + d.y +")"; })
					.duration(500)
					.delay(750)   // one second after .oldnode fades in
					.each('end', function() {
						// Fade in
						d3.select(this).selectAll('rect')
							.transition()
								.style('opacity', 1)
							.delay(500)
							.duration(200)
							.each('end', showSankeyNodeLabel);	
					});
				
				// Install drag handler on all language nodes
				that.sAllNode
					.call(d3.behavior.drag()
						.origin(function(d) { return d; })
						.on("dragstart", function() { this.parentNode.appendChild(this); })
						.on("drag", dragmove));
				// -- Finished creating nodes -- //
				
				
				
				// -- Create links ------------- //
				// Put an opaque canvas-colored box that will go on top of genetic link paths
				// --- 4th element in SVG
				that.svg.insert('g', ':first-child')
					.attr('class', 'genlinkcurtain')
					.append('rect')
						.attr('width', that.width+that.infoWidth)
						.attr('height', that.height)
						.style('stroke', that.canvasColor)
						.style('fill', that.canvasColor)
						.style('opacity', 1);
				// Create Genetic Links --- this is 3rd element in SVG
				that.sGeneticLink = that.svg.insert("g", ":first-child")
					.attr('class', 'genlinkgroup')
					.selectAll('.'+that.geneticLinkClass)
						.data(that.geneticLinks)
				.enter()
					.append("path")
						.attr('class', that.geneticLinkClass + ' ' + that.treeLinkClass)
						.attr('d', that.sankeyPath)
						.style("stroke-width", function(d) { return Math.max(1, d.dy); })
						.sort(function(a,b) { return b.dy - a.dy; });	
				
				// Put an opaque canvas-colored box on top of contact link paths
				// --- This is 2nd element in SVG
				that.svg.insert('g', ':first-child')
					.attr('class', 'conlinkcurtain')
					.append('rect')
						.attr('width', that.width+that.infoWidth)
						.attr('height', that.height)
						.style('stroke', that.canvasColor)
						.style('fill', that.canvasColor)
						.style('opacity', 1);
				// Create Contact Links --- This is 1st element in SVG
				that.sContactLink = that.svg.insert("g", ":first-child")
					.attr('class', 'conlinkgroup')
					.selectAll('.'+that.contactLinkClass)
						.data(that.contactLinks)
				.enter()
					.append("path")
						.attr('class', that.contactLinkClass + ' ' + that.treeLinkClass)
						.attr('d', that.sankeyPath)
						.style('stroke-width', function(d) { return Math.max(1, d.dy); })
						.sort(function(a,b) { return b.dy - a.dy; });	
				// The curtains placed on top of the links will be unveiled immediately
				// after the old nodes have transitioned to their proper location
				// -- Finished creating links -- //
				

				// Unveil curtains hiding links, so it looks like links are being drawn
				// from left to right / right to left
				that.svg.selectAll('.genlinkcurtain')
					.transition()
						.attr('transform', function(d) { return 'translate('+-(that.width+that.infoWidth+1)+',0)' })
					.duration(500)
					.delay(1500);
				that.svg.selectAll('.conlinkcurtain')
					.transition()
						.attr('transform', function(d) { return 'translate('+(that.width+that.infoWidth+1)+',0)' })
					.duration(500)
					.delay(1500);
					
				// Remove screen blocking mouse events
				that.svg.select('.screen')
					.transition()
						.style('opacity', 0)
					.duration(1)
					.delay(2000)
					.remove();

				// There shouldn't be anything waiting to exit the scene at this point,
				// but just in case there is, fade it out quickly.
				that.sAllNode.exit()
					.transition()
						.style('opacity', 0)
					.duration(250)
					.remove();
					
				// Move group labels to top
				that.svg.select('.rootLabel').each(function() { this.parentNode.appendChild(this); });	
				
				// Install mouseOver event handlers on all nodes.
				that.sAllNode
					.on("mouseover", function(e) {
						// Gray out every node + link that does not flow into this node at some
						// point in history. I.e., highlight every link/node that influenced this
						// language at some point in history.
						// Start by deactiving all nodes/links, then whitelist anything that
						// influences node that mouse is hovering over.
						if(that.mouseOverLock!==undefined && that.mouseOverLock===true) return;
						
						var links = that.svg.selectAll('path'),
							nodes = that.svg.selectAll('g.'+that.nodeClass);
						
						// 
						function _(myParentLinks) {
							if( myParentLinks===undefined || myParentLinks.length==0 ) return;
							for(var i=0; i<myParentLinks.length; i++) {
								if(myParentLinks[i].data===undefined) myParentLinks[i].data = {};
								var myParent = myParentLinks[i].source;
								if(myParent.data===undefined) myParent.data = {};
								myParentLinks[i].data.show = true;
								myParent.data.show = true;
								_(myParent.targetLinks);
							}
						};
						_(e.targetLinks);
						if(e.data===undefined) e.data = {};
						e.data.show = true;
						
						// Now go through all parents of current node and enable them.
						var dimTo = .4;
						nodes.transition()
							.style('opacity', function(d) {
								return (d.data===undefined      ||
										d.data.show===undefined ||
										d.data.show!==true)? dimTo : 1;
							})
							.duration(250)
							.transition()
							.style('fill', function(d) {
								return (d.data===undefined		||
										d.data.show===undefined	||
										d.data.show!==true)? '#bbb' : null;
							})	
							.duration(250);
						links.transition()
							.style('opacity', function(d) {
								return (d.data===undefined      ||
										d.data.show===undefined ||
										d.data.show!==true)? dimTo : 1;
							})
							.duration(250)
							.transition()
							.style('stroke', function(d) {
								return (d.data===undefined		||
										d.data.show===undefined	||
										d.data.show!==true)? '#ccc' : null;
							})
							.duration(250);
							
							that.mouseOverLock = true;
					})
					.on("mouseout", function(e) {
						// Enable all nodes that were disabled with the mouseover event.
						that.svg.selectAll('g.'+that.nodeClass)
							.transition()
							.style('opacity', function(d) {
								if(d.data===undefined) d.data = {};
								d.data.show = false;
								return 1;
							})
							.duration(250)
							.transition()
							.style('fill', function(d) {
								if(d.data===undefined) d.data = {};
								d.data.show = false;
								return null;
							})
							.duration(250);
						that.svg.selectAll('path')
							.transition()
							.style('opacity', function(d) {
								if(d.data===undefined) d.data = {};
								d.data.show = false;
								return 1;
							})
							.duration(250)
							.transition()
							.style('stroke', function(d) {
								if(d.data===undefined) d.data = {};
								d.data.show = false;
								return null;
							})
							.duration(250);
							
							that.mouseOverLock = false;
					});
				
				that.sankeyShowing = true;
			});
			// --- End of .loadRoots() callback --- //
				
			// --- Auxiliary functions --- //
			// No more layout happens below here in this function, but these auxilliary
			// functions need access to this function's scope, so they're defined here.
			function showSankeyNodeLabel() {
				var element = this;
				// Add text labels to nodes
				d3.select(element.parentNode)
					.append("text")
						.style('opacity', 0)
						.attr("y", function(d) { return d.dy / 2; })
						.attr("dy", ".35em")
						.attr("transform", null)
					.filter(function(d) { return d.x < (that.width+that.infoWidth) / 2; })
						.attr("x", 6 + that.sankey.nodeWidth())
						.attr("text-anchor", "start");
				var text = d3.select(element.parentNode).select('text');
							
				var xpos = d3.select(element).data()[0].x,
					scrMid = (that.width + that.infoWidth / 2),
					lblPos = (xpos<scrMid)? 6 + that.sankey.nodeWidth() : -6,
					lblAnchor = (xpos<scrMid)? 'start' : 'end';
					
				// Write the language name
				text.append('tspan')
					.text(function(d) {
						var name = d.data.fullname;
						if(name===undefined) name = d.name;
						return name;
					})
					.attr('text-anchor', lblAnchor)
					.attr('x', lblPos);
				
				// For each cognate in the language, create a new line displaying this cognate
				var words = d3.select(element).data()[0].data.words;
				if(words===undefined) words = [];
				
				for(var i=0; i<words.length; i++) {
					// Add textual content
					var word = words[i],
						string = '';
					if(word.sign!='') {
						if(word.sign===undefined || word.gloss===undefined) {
							// might be a string, not a more complex object
							string = word;
						}else{
							string += word.sign;
							if(word.auxType) {
								string += "[" + word.gloss + "]";
							}else{
								string += "'" + word.gloss + "'";
							}
						}
					}
					text.append('tspan')
						.attr('dy', 10)
						.attr('text-anchor', lblAnchor)
						.attr('x', lblPos)
						.style('fill', '#900')
						.text(string);
				}

				// Fade in the text
				text.transition()
						.style('opacity', 1)
					.duration(500);
			}
			
			function dragmove(d) {
				// Drag event handler
				d3.select(this)
					.attr("transform",
						  "translate(" +
									 (d.x = Math.max(0, Math.min((that.width+that.infoWidth) - d.dx, d3.event.x)))
									 +","+
									 (d.y = Math.max(0, Math.min(that.height - d.dy, d3.event.y)))
									 + ")");
				that.sankey.relayout();
				that.sContactLink.attr("d", that.sankeyPath);
				that.sGeneticLink.attr("d", that.sankeyPath);
			}
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
			return function(d) {
				var center = (d.data.group)? that.centers[d.data.group] : {x: that.width/2, y: that.height/2};
				var tX = center.x;
				var tY = center.y;
				d.x = d.x + (tX - d.x) * (that.defaultGravity - .05) * alpha;
				d.y = d.y + (tY - d.y) * (that.defaultGravity - .05) * alpha;
			};
		},
		//
		//
		//
		// HELPER FUNCTIONS
		//
		//
		//
		getNodeKey: function(d) {
			var key = jn.thing.buckLookup[d.name];
			if(key===undefined) key = d.name;
			return key;
		},
		//
		//
		//
		inNodesArray: function(needle, haystack, boolean) {
			var that = this;
			if(boolean===undefined) boolean=false;
			// Determine if needle (lang) is in Nodes array haystack.
			// Returns index if found, returns -1 if not found.
			// If `boolean` is set to true, returns true if found, false if not.
			// By default boolean is set to false.
			for(var i=0; i<haystack.length; i++) {
				var buckLang = haystack[i].name;
				if(buckLang===undefined) return false;
				var isoLang = this.buckLookup[buckLang];
				if(needle==buckLang || needle==isoLang) {
					return boolean? true : i;
				}
			}
			return boolean? false : -1;
		},
		//
		//
		//
		getNodeFromTree: function(lang) {
			var that = this;
			// Get a language from the ietree in cache
			var nodeOrigin = $.extend(true, {}, this.cachedJSON.tree[lang]);
			// Add meta information -- don't overwrite existing meta info (if any)
			if(nodeOrigin.meta===undefined) nodeOrigin.meta = {};
			nodeOrigin.meta.iso = lang;
			nodeOrigin.name = lang;
			// Add other data -- don't overwrite existing meta info (if any)
			if(nodeOrigin.data===undefined) nodeOrigin.data = {};
			nodeOrigin.data['leaf'] = false;
			return nodeOrigin;
		},
		//
		//
		//
		sankeyNodeClassString : function(d, baseClassString) {
			// Create a class string for the node based on status (alive, dead, reconstructed)
			var classes =  baseClassString + ' ';
			if(!d.data.attested) {
				classes += "theoretical";
			}else if(d.data.living) {
				classes += "alive";
			}else{
				classes += "dead";
			}
			return classes;
		},
		//
		//
		//
		updateNodesForSankey: function() {
			// Updates nodes list and links (geneticLinks and contactLinks)
			// to prepare for being layed out via the d3 Sankey Diagram plugin.
			///// Rewritten code
			var that = this;
			
			// Create links Arrays. These are local arrays and will not be
			// transferred to the class objects until the end of this function.
			var genLinks = [],
				conLinks = [];
			
			// Alias nodes object locally. Remember this aliases reference; it
			// doesn't copy values.
			var nodes = this.nodes;
			
			// Copy current nodes statically into glossedNodes. Every node that
			// has a gloss has already been stored in this.nodes by this.loadRoots.
			// It will be helpful to have these stored apart from the this.nodes
			// Array, which will be mutated.
			var glossedNodes = [];
			$.extend(true, glossedNodes, nodes);
			
			// Create a queue for adding parents to tree (this.nodes).
			// Initialize queue with current this.nodes values. Make sure
			// to deep copy instead of passing by reference.
			var nodesQueue = [];
			$.extend(true, nodesQueue, nodes);
			
			// Create a map that stores basically the inverse of the cached IE tree,
			// i.e., tells which children derive from which parent. This is used for
			// pruning the tree, by eliminating nodes which only have one descendent.
			// Also count number of parents for each node.
			var nodeInfluenceMap = {},
				nodeIncomingMap = {};
			
			while(nodesQueue.length>0) {
				// Find parents of every node in the queue; add these parents to queue,
				// find their parents, etc. Build up array of links in this way.
				var curNode = nodesQueue.shift();
				
				// Alias key node information
				var buckName = curNode.name,
					isoName = curNode.meta.iso;
				
				// Look up genetic / contact information in cached IE Tree.
				var langData = this.cachedJSON.tree[isoName];
				
				// Pass if node is not found in IE Tree
				if(langData===undefined) continue;
				
				// Function for creating links based on list of genetic / contact parents
				// List `parents` should be given as Array of ISO language codes
				var _l = function(parents, type) {
					var links = [];
					
					// Count number of parents
					if(nodeIncomingMap[isoName]===undefined) nodeIncomingMap[isoName] = 0;
					nodeIncomingMap[isoName] += parents.length;
					
					for(var i=0; i<parents.length; i++) {
						// For each parent, see if it's already a node in the Sankey diagram
						var parent = parents[i],
							parentIndex = -1;
						if(parent.length<1) continue;
						
						// Add the current node to the Array of languages that derive from this one.
						if(nodeInfluenceMap[parent]===undefined) nodeInfluenceMap[parent] = [];
						nodeInfluenceMap[parent].push([isoName, type]);
						
						// If parent is not a recognizable language node, skip it
						if((parentIndex=that.inNodesArray(parent, nodes))===false) continue; 
					
						if(parentIndex<0) {
							// If parent is not already in nodes, add it
							var newNode = that.getNodeFromTree(parent);
							parentIndex = nodes.length;
							nodes.push(newNode);
							if(that.inNodesArray(parent, nodesQueue)<0) {
								// Add this node to the nodesQueue if it isn't there already
								nodesQueue.push(newNode);
							}
						}
						
						// Create new link: uses ISO Names, not indexes: not a valid Sankey link yet!
						var newLink = {
							source : parent,
							target : isoName,
						};
						
						// Add this new link to the specified links array.
						links.push(newLink);
					}
					return links;
				}
				
				// Create genetic and contact links from node info, add these genetic
				// and contact parents to nodesQueue if necessary.
				genLinks = genLinks.concat(_l(langData.genparent, 'gen'));
				conLinks = conLinks.concat(_l(langData.influencedby, 'con'));
			}
			// End of while loop over nodesQueue. All nodes' parents have been comprehended.
			
			// - PRUNING -
			// For any nodes with a single descendent, disconnect nodes coming IN to this
			// node and connect them to the first descendent with multiple descendants.
			// (I.e., if the immediate child of this node only has one descendant as well,
			// skip that one, too, and connect to the next grandchild with multiple descendents.)
			// Additional rules: nodes with zero descendants are treated as nodes with multiple
			// descendants lest any loose ends be created. Also, IMPORTANTLY, any node that has
			// a gloss should NOT be disconnected, even if it has just one descendant. An example
			// of that might be Middle English en route to Modern English: don't disconnect 
			// Middle English, since the gloss is important information to display.
			that.nodeInfluenceMap = nodeInfluenceMap;
			for(var lang in nodeInfluenceMap) {
				// Glosses trump all: don't disconnect glossed languages.
				if(that.inNodesArray(lang, glossedNodes, true)) continue;
				
				var children = nodeInfluenceMap[lang];
				
				if(children.length==1) {
					// Node must be disconnected. Get its index in nodes array.
					var index = that.inNodesArray(lang, nodes);
					
					// Find the descendant with a number of children not equal to one,
					// or is not glossed.
					var heirLang = children[0][0];
					
					// Switch to find the ultimate influence type on heir: contact or genetic
					var contact = (children[0][1]=='con');
					
					while(nodeInfluenceMap[heirLang]!==undefined 		&&
						  nodeInfluenceMap[heirLang].length==1   		&&
						  !that.inNodesArray(heirLang, glossedNodes, true))
					{
						var heirLangTuple = nodeInfluenceMap[heirLang][0];
						heirLang = heirLangTuple[0];
						contact = contact || (heirLangTuple[1]=='con');
					}
					
					// Transfer number of parents from current node to heir child.
					if(nodeIncomingMap[heirLang]===undefined) nodeIncomingMap[heirLang] = 0;
					if(nodeIncomingMap[lang]===undefined) nodeIncomingMap[lang] = 0;
					nodeIncomingMap[heirLang] += nodeIncomingMap[lang];
					
					// Lastly, find any links that have this language as a target, adjust
					// such that target is heirLang. There is one link that has this
					// language as a source: set its .target and .source properties to null.
					var _d = function(links) {
						// Reusable code. Modifies `links` array.
						for(var i=0; i<links.length; i++) {
							if(links[i].target==lang) {
								links[i].target = heirLang;
								links[i].contact = contact;
							}
							if(links[i].source==lang) links[i] = {target:null, source:null};
						}
					}
					_d(genLinks);
					_d(conLinks);
					
					// Now remove this language node from nodes array.
					nodes.splice(index, 1);
				}
				
				// Don't do anything with nodes that have multiple children.
			}
			
			// Transfer geneticLinks that ended up as contactLinks through pruning to contactLinks.
			for(var i=0; i<genLinks.length; i++) {
				if(genLinks[i].contact===true) {
					var newConLink = {};
					$.extend(true, newConLink, genLinks[i]);
					conLinks.push(newConLink);
					genLinks[i] = {source: null, target: null, contact: false};
					//genLinks.splice(i, 1);
				}
			}
			that.genLinks = genLinks;
			
			// Finally, create links that are usable by Sankey (i.e. map indexes in nodes array)
			var _s = function(baseLinks) {
				// Use isoNames in baseLinks to map to indexes in nodes array
				var links = [];
				for(var i=0; i<baseLinks.length; i++) {
					var curLink = baseLinks[i],
						newLink = {};
					
					// Ignore links in which source and target were set to null.
					if(curLink.source===null && curLink.target===null) continue;
					
					// Update nodes array with indexes
					newLink.source = that.inNodesArray(curLink.source, nodes);
					newLink.target = that.inNodesArray(curLink.target, nodes);
					
					// Ignore links that ended up with source=target
					if(newLink.source==newLink.target) continue;
					
					// Update value to be proportional to the number of children
					var nTo = nodeIncomingMap[curLink.target],
						nFr = nodeInfluenceMap[curLink.source].length,
						div = (nTo>nFr)? nTo : nFr;
					newLink.value = 1 / div;
					
					links.push(newLink);
				}
				return links;
			}
			
			this.geneticLinks = _s(genLinks);
			this.contactLinks = _s(conLinks);
		},
		//
		//
		//
		clearForceGraph: function() {
			var that = this;
			// Helper function to disable the force graph and all the handlers that enhance it
			d3.event.stopPropagation();
			
			// Note this is not calling force.stop() directly. See .stop() method for details.
			this.stop();
			
			this.svg.selectAll('.'+this.defTextClass)
				.transition()
					.style('opacity', 0)
				.duration(250)
				
			// Remove drag event
			this.svg.selectAll('.'+this.nodeClass).on('mousedown.drag', null);
			
			$('#jn-widgetcontainer #words').fadeOut('fast', function() {
				// Hide concepts while force graph is hidden, but make button that will reveal them again
				if($('#jn-widgetcontainer #showconcepts').length<1) {
					$('#jn-widgetcontainer #dash')
						.append($("<a href='#jnchart' id='showconcepts' style='font-size: .5em;'>Show concepts</a>")
						.click(function() {
							$(this).fadeOut('fast', function() {
								$(this).remove();
								$('#jn-widgetcontainer #words').fadeIn('fast');
							});
						}));
				}
			});
		},
		//
		//
		//
		clearSankey : function (callback) {
			var that = this;
			
			// Hide the PIE root text
			that.groupLabels
				.transition()
					.attr('transform', 'translate(20, -100)')
				.duration(500);
			
			// Put meaningNode back in canvas
			that.svg.selectAll('.'+that.defTextClass)
				.transition()
					.style('opacity', 1)
				.duration(250);
			
			// Draw curtains over link paths to hide them
			// (and remove them from the canvas)
			that.svg.selectAll('.conlinkcurtain')
				.transition()
					.attr('transform', function(d) { return 'translate(0,0)' })
				.duration(250)
				.delay(0)
				.each('end', function() {
					d3.selectAll('.'+that.contactLinkClass).remove();
					d3.select(this).remove();
				});
			that.svg.selectAll('.genlinkcurtain')
				.transition()
					.attr('transform', function(d) { return 'translate(0,0)' })
				.duration(250)
				.delay(0)
				.each('end', function() {
					d3.selectAll('.'+that.geneticLinkClass).remove();
					d3.select(this).remove();
				});
			
			// Hide non-cognate nodes, remove from SVG
			that.svg.selectAll('.newnode')
				.transition()
					.style('opacity', 0)
				.duration(500)
				.each('end', function() { d3.select(this).remove(); });
			
			// Sankey turned circular nodes into rectangles. Change them back
			// Also reset label text.
			that.svg.selectAll('.oldnode')
				.append('circle')
					.attr('r', that.radius)
					.style('opacity', 0)
			that.svg.selectAll('.oldnode rect')
				.transition()
					.attr('width', that.radius)
				.duration(500)
				.transition()
					.attr('height', that.radius)
				.duration(500);
			// Legerdemain: move objects while changing from rect to circle
			// Move towards center of original synie panel
			that.svg.selectAll('.oldnode')
				.transition()
					.attr('transform', function(d) {
						// Move pseudo-randomly, somewhere near initial position
						var theta = Math.random() * 2 * Math.PI;
						var x = that.width/2 * (1 + Math.cos(theta)/2),
							y = that.height/2 * (1 + Math.sin(theta)/2);
						d.meta['newpos'] = {x:x, y:y};
						return 'translate(' + x + ',' + y + ')';
					})
				.duration(500)
				.delay(500)
				.transition()
					.style('fill', that.inactiveColor)
				.delay(500)
				.duration(500)
				.each('end', function(d) {
					d.x = d.meta['newpos'].x;
					d.y = d.meta['newpos'].y;
				});
			that.svg.selectAll('.oldnode rect')
				.transition()
					.style('opacity', 0)
				.duration(300)
				.delay(500)
				.each('end', function() { d3.select(this).remove(); });
			that.svg.selectAll('.oldnode circle')
				.transition()
					.style('opacity', 1)
				.duration(500)
				.delay(500);
			that.svg.selectAll('.oldnode text')
				.transition()
					.style('opacity', 0)
				.duration(500)
				.each('end', function() {
					d3.select(this.parentNode)
						.append('text')
							.attr('style', 'font-size: .7em; text-anchor: middle;')
							.style('fill', that.labelColor)
							.attr('class', that.labelClass)
							.text(function(d) { return d.name; });
					d3.select(this).remove();
				});
			that.sankeyShowing = false;
			d3.select('g').transition().delay(1000).each('end', callback);
		},
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
			this.groupLabels = this.svg.selectAll("text." + this.rootLabelClass).data(this.roots);
			this.groupLabels.exit().remove();
			for(var i=0; i<this.nodes.length; i++) {
				this.roots[this.nodes[i].data.group] = {
					root  : this.nodes[i].data.PIEroot,
					group : this.nodes[i].data.group
				}; 
			}

			this.groupLabels = this.svg.selectAll("text." + this.rootLabelClass)
				.data(this.roots);
			this.groupLabels
			.enter()
				.append("svg:text")
					.attr("style", "font-size: 1em;")
					.attr("class", this.rootLabelClass)
					.style("fill", this.canvasColor)
					.attr("transform", function(d) {
						var dx = that.width + that.infoPadding.x,
							dy = (1 + d.group) * (15 + that.infoPadding.y);
						return "translate("+ dx +","+ dy +")";
					})
					.on("mouseover", function(d1) {
						if(that.forceStopped || that.animationLock) return;
						d3.select(this).style('font-weight', 'bold');
						that.sAllNode
							.style("fill", function(d2) {
								if(d2.data.group==d1.group) {
									return that.color(d1.group);
								}else{
									return that.inactiveColor;
								}
							})
							.attr("inactive", "true");
					})
					.on("mouseout", function(d1) {
						if(that.forceStopped || that.animationLock) return;
						d3.select(this).style('font-weight', 'normal');
						that.sAllNode
							.style("fill", function(d2) {
								return that.color(d2.data.group);
							})
							.attr("inactive", "false");
					})
					.on("click", function(d1) {
						if(that.forceStopped || that.animationLock) return;
						that.selectedRoot = this;
						that.forceStopped = true;
						that.animationLock = true;
						that.clickedRoot(this);
					});
					
			// Fade out exiting labels
			this.groupLabels
				.exit()
					.transition()
						.style("opacity", 0)
					.duration(300)
					.remove();
					
			
			// Set text for ALL labels (not just newly entering labels)
			this.groupLabels.text(function(d) {
				var rootText = "";
				for(var i in d.root){
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
			this.groupLabels.attr("root", function(d) {
				var rootAttr = "";
				for(var i in d.root) {
					// TODO - This might be one of multiple roots in the string!!
					// The others WILL NOT BE ACCESSIBLE VIA CLICK!
					rootAttr = d.root[i].root; 
				}
				return rootAttr;
			});
			
			// Set transitions
			this.groupLabels
				.transition()
					.style("fill", function(d) {
						return that.color(d.group);
					})
				.duration(500);
		},	
		//
		//
		//
		randomPointOutsideScreen : function() {
			var that = this;
			// Return a random point outside of the SVG
			var wr = (that.width + that.infoWidth) / 2,
				hr = (that.height)/2,
				r = 1.5 * ((hr>wr)? hr : wr), // Use 1.5 as quicker sqrt(2)
				theta = 2 * Math.PI * Math.random(); // random angle in circle
			// Get coordinates of random position
			var x = wr + (Math.cos(theta) * r),
				y = hr + (Math.sin(theta) * r);
			return { x:x, y:y };
		},
		//
		//
		//
		loadRoots: function(root, callback) {
			var that = this;
			var rootText = $(root).attr('root');
			// Load data into d3 SVG widget
			function _loadNewData(json) {
				var selected = that.svg.select('text[root='+rootText+']');
				that.groupLabels = that.svg.selectAll("text." + that.rootLabelClass)
					.data(selected.data(), function(d) { return d.group; });
				
				// Fade out unclicked group labels
				that.groupLabels
					.exit()
						.transition()
							.style("opacity", 0)
						.duration(500)
						.remove();
			
				// Iterate through nodes, keep only those for which languages there
				// is data in our IETree. This database may not be complete!
				var validNodes = [];
				for(var i=0; i<json.length; i++) {
					var buckName = json[i].name,
						isoName = that.buckLookup[buckName],
						langData = that.cachedJSON.tree[isoName];
				
					// Check presence of node in tree database
					if(langData===undefined) {
						// Might be that buckName is in fact an isoName, check that contingency
						langData = that.cachedJSON.tree[buckName];
						if(langData===undefined) {
							// Sadly IE tree DB is not complete, so might just not be defined
							// console.log('Skipping undefined language `' + buckName + '`');
							continue;
						}
					}
					
					// Language definitely has data in DB if procedure makes it to here.
					// Update this node with some useful data from IE Tree DB
					if(json[i].meta===undefined) json[i].meta = {};
					json[i].meta.iso = isoName;
					if(json[i].data===undefined) json[i].data = {};
					json[i].data.attested = langData.data.attested;
					json[i].data.living = langData.data.living;
					json[i].data.fullname = langData.data.fullname;
					
					// Add this node to 'validNodes' array
					validNodes.push(json[i]);
				}
				
				// Set nodes set equal to cognates that have been found
				that.nodes = validNodes;
				that.edges = [];
				
				// Get rid of links in Force graph
				that.svg.selectAll('line.'+that.linkClass)
					.data([])
				.exit()
					.transition()
						.style("opacity", 0)
					.duration(250)
					.remove();
				
				// Get rid of extra nodes in Force graph
				that.svg.selectAll('.'+that.extraClass)
					.data([])
				.exit()
					.transition()
						.style("opacity", 0)
					.duration(500)
					.remove();
			
				return callback();
			}
			
			// Get root from cache if cache is enabled, otherwise via AJAX.
			if(this.cache) {
				// Important that the array is copied and not passed directly,
				// lest it be modified in the cache
				var cachedArray = $.extend(true, [], this.cachedJSON['roots'][rootText]);
				_loadNewData(cachedArray);
			}else{
				var url = this.singURL + 'root' + '&w=' + rootText;
				$.getJSON(url, _loadNewData)
			}
		},
		//
		//
		//
		loadNodes: function(word, callback) {
			var that = this;
			function _loadNewData(json) {
				// Add JSON to widget
				that.nodes = json.nodes;
				that.edges = json.edges;
				that.groups = json.meta.groups;
				
				// Add links
				that.links = that.svg.selectAll("line."+that.linkClass)
					.data(that.edges);
				that.links.enter()
					.insert("svg:line", ":first-child")
					.attr("class", that.linkClass);
				that.links.exit()
					.remove();
				
				// --- Set up nodes elements on canvas --- //
				// Set up nodes
				that.sAllNode = that.svg.selectAll('.'+that.nodeClass)
					.data(that.nodes, function(d) { return d.name; });
				that.sAllNode
					.enter()
						.append("svg:g")
						.attr("class", that.nodeClass + ' ' + that.extraClass)
						.each(function() {
							var point = that.randomPointOutsideScreen();
							// Initialize position here
							d3.select(this)
								.attr('x', point.x)
								.attr('y', point.y);
						});
						
				var newNodes = that.svg.selectAll('.'+that.extraClass);
				newNodes
					.append("circle")
						.attr("r", that.radius);
				newNodes
					.append('text')
						.attr("class", that.labelClass)
						.attr("style", "font-size: .7em; text-anchor: middle;")
						.style("fill", that.labelColor)
						.text(function (d) { return d.name; });
				newNodes
					.append("title")
						.text(function(d) { return (d.meta)? d.meta.fullname : ""; });
				
				that.sAllNode
					.transition()
						.style("fill", function(d) { return that.color(d.data.group); })
					.duration(500);
				
				that.sAllNode
					.exit()
						/*.transition()
							.style("opacity", 0)
						.duration(500)
						.remove();*/
						.each(function() {
							// move to random place outside the stage
							var point = that.randomPointOutsideScreen();
							// Animate translation of object to this position
							d3.select(this)
								.transition()
									.attr('transform', 'translate(' + point.x + ',' + point.y + ')')
								.duration(1000)
								.each('end', function() { d3.select(this).remove(); });
						});
								
				that.start();
				
				// add mouse events to circle
				that.sAllNode
					.on("mouseover", function(d) {
						if(that.forceStopped || that.animationLock) return;
						// Show middle text
						that.defText.text(function (e) { return d.data.sign; });
						that.defText.style("fill", function (e) { return that.color(d.data.group); });
						
						d3.select(this).select('circle')
							.transition()
								.attr('r', that.radius+5)
							.duration(200);
						
						
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
						if(that.forceStopped || that.animationLock) return;
						that.defText.style("fill", that.canvasColor);
						that.defText.text("");
						
						d3.select(this).select('circle')
							.transition()
								.attr('r', that.radius)
							.duration(200);
						
						// re-highlight all roots
						that.groupLabels.style("fill", function(d1) { return that.color(d1.group); });
						that.force.resume();
					});
				return callback();
			}
			
			function _loadJSON(callback) {
				// If cache was set to true, get data from there, not server
				if(that.cache) {
					// Important that the array is copied and not passed directly. Otherwise
					// unpredictable results will obtain.
					var cached_array = $.extend(true, {}, that.cachedJSON['words'][word]);
					callback(cached_array);
				}else{
					var url = that.singURL + 'concept' + '&w=' + word;
					$.getJSON(url, callback)
				}
			}
			
			if(this.sankeyShowing) {
				// If Sankey's showing, clear it, then load requested data
				that.clearSankey(function() { _loadJSON(_loadNewData); });
			}else{
				// Otherwise just load requested data
				_loadJSON(_loadNewData);
			}
		}
	};
}





// WP Widget Init function
// (Call this code from wordpress post to set up widget)
jn.LastSlice = function () {
	var chart = new jn.LastSliceChart();
	chart.cache = true;
	chart.ready(function() {
		$('#words a').click(function() {
			$(this).addClass('active');
			$(this).siblings('a').removeClass('active');
			var curword = $(this).text();
			chart.changeWord(curword);
		});
		$('#words a:first-child').trigger("click");
	});
	return chart;
}