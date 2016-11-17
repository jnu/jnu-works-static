/**
 * ncaa/bracket.js
 *
 * Bracket object for visualizing a single elimination tournament.
 *
 * Built on jQuery (+mobile) and RaphaelJS.
 *
 * Copyright (c) 2013 Joseph Nudell.
 * Freely distributable under the MIT license.
 */


function Bracket(params) {
	if(params===undefined) params = {};
	
	var obj = {
		/// --- Default Object Parameters --- ///
		// Note: These can all be overridden on initialization by setting `params`
		// object appropriately.
		// Node Params
		nodeVPadding         : 1,
		nodeHPadding         : 5,
		nodeColor	         : '#FCD3B1',
		nodeHoverColor       : 'rgb(92, 199, 92)',
		opponentPathColor    : 'rgb(142, 202, 202)',
		opponentHoverColor   : 'rgb(69, 149, 149)',
		teamPathColor	     : 'rgb(160, 227, 160)',
		lostGameColor	     : 'rgb(249, 115, 115)',
		lostGameHoverColor   : 'rgb(162, 37, 37)',
		nodeStroke	         : 'rgb(255, 86, 0)',
		navButtonFill	     : 'rgb(30,30,30)',
		navButtonHoverFill   : 'rgb(100,100,100)',
		navButtonStroke	     : 'rgb(10,10,10)',
		navButtonHoverStroke : 'rgb(20,20,20)',
		textCorrectCls	     : 'game-correct',
		textIncorrectCls     : 'game-incorrect',
		nodeStrokeWidth      : 1,
		nodeHoverScale       : {x: 1.1, y: 1.2},
		pathType	         : 'smooth',			// No other options are supported yet.
		pathColor		     : '#333',
		cornerRadius         : 10,
		bgColor              : '#eee',
		bgOpacity	         : 0.0,
		bgStroke             : '#aaa',
		popupBgColor	     : '#eee',
		popupOpacity	     : 0.7,
		navButtonSize		 : 12,		// length of a or b side of one nav triangle
		// Zoom effects
		zoomDuration         : 300,
		zoomEasing           : "<>",    // Can either be Raphael.easing_formulas id or a function mapping to range [0,1]
		// Auto-caching -- cache on load
		autoCache		     : true,
		//
		//
		//
		/// --- Size parameters. Altering these will NOT be honored at this		  --- ///
		/// --- time, as these field are dynamically calculated to fit on screen. --- ///
		width     	       : $(window).outerWidth(true),
		height    	       : $(window).outerHeight(true),
		origin		       : null,
		nodeWidth	       : null,
		nodeHeight	       : null,
		nodeRadius         : 1,
		//
		//
		//
		/// --- Containers and stuff. Don't customize. --- ///
		zoomAnimation      : null,
		paper     	       : null,
		bg        	       : {},
		data		       : {},
		navButtons   	   : [],
		nodes		       : [],
		regions			   : [],
		titleLbl		   : null,
		titleYOffsetRat    : .04,
		season			   : '',
		popup			   : null,
		rounds		       : 0,
		roundLabels		   : [],
		regionLabels	   : [],
		// Window resize delay (so that Raphael doesn't go crazy on window.resize)
		_rsTimer           : null,
		_rsDelta	       : 100,
		// Keep track of state
		state			   : {
			region : -1,
		},
		correctedBracket   : null,
		baseURL            : '/sandbox/ncaa/', 
		scores             : [320, 160, 80, 40, 20, 10],
		score			   : null,
		scoreLbl		   : null,
		scoreLblYPad	   : 10,
		statsCache		   : null,
		//
		//
		//
		// Functions
		//
		//
		//
		init : function(data) {
			var that = this;
			
			// Store meta information from data
			if(data.rounds[data.rounds.length-1].toLowerCase()=='playin') {
				this.rounds = data.rounds.length - 1;
				this.roundLabels = data.rounds.slice(0, this.rounds);
			}else{
				this.rounds = data.rounds.length;
				this.roundLabels = data.rounds;
			}
			
			this.regions = data.regions;
			this.season = data.season;
			
			// make paper fill the screen
			// Adjust layout
			that.adjustSizes();
			this.paper = Raphael(0, 0, this.width, this.height);
			
			// Create background
			this.bg = this.paper.rect(0, 0, this.width, this.height);
			
			this.bg.attr('fill', this.bgColor);
			this.bg.attr('stroke', this.bgStroke);
			this.bg.attr('opacity', this.bgOpacity);
			
			// Make title
			that.titleLbl = that.paper.text(that.width/2, that.height*that.titleYOffsetRat, data.season||"")
									  .attr('text-anchor', 'middle')
									  .attr('font-size', "14px");
			
			if(data.correctedAgainst) {
				// Fetch bracket to use in correction, if specified. Valid formats are bracket name, bracket id
				// and bracket itself (in JSON)
				/// Add notice to page
				var titBox = that.titleLbl.getBBox();
				that.scoreLbl = that.paper.text(that.titleLbl.attr('x'), titBox.y2+that.scoreLblYPad, "Scoring ...")
										  .attr('text-anchor', 'middle');
				
				function _loadAndCorrectBracket(data) {
					that.correctedBracket = data.nodes;
					that.correct();
				}
				
				if(typeof data.correctedAgainst=='string') {
					that.fetchBracketFromDB(data.correctedAgainst, 'season', _loadAndCorrectBracket);
				}else if (typeof data.correctedAgainst=='number') {
					that.fetchBracketFromDB(data.correctedAgainst, 'id', _loadAndCorrectBracket);
				}else if (typeof data.correctedAgainst=='object') {
					that.correctedBracket = data.correctedAgainst;
				}
			}
			
			
			// Bind window resize event to bracket resize handler
			$(window).resize(function(e) {
				// Only execute the (very consumptive) resize event
				// after user is finished resizing. Approximate this
				// by executing after {that._rsDelta}ms since last resize.
				clearTimeout(that._rsTimer);
				that._rsTimer = setTimeout(function() {
					that.resize();
				}, that._rsDelta);
			});
			
			$(window).on('orientationchange', function(e) {
				// For mobile devices
				that.resize();
			});
			
			// Layout Bracket with nodes
			if(this.nodes) {
				this.layoutBracket(data.nodes);
			}
			
			// Start caching stats in the background
			if(that.autoCache) {
				for(var i=(1<<that.rounds)-1; i<that.nodes.length; i++) {
					that.loadStatsFromDB('squad', that.nodes[i].data.sid, function(d) { return; }, true);
				}
			}
		},
		//
		//
		//
		fetchBracketFromDB : function(bracket, filter, callback, method) {
			// Fetch the corrected bracket from the server. Able to fetch by name or by ID.
			// Specify which by 'key' (either 'season' or 'id').
			var that = this;
			if(method===undefined) method = 'heap';
			$.ajax({
				url : that.baseURL + 'fetchbracket.py?db=1&method='+method+'&id='+bracket+'&f='+filter,
				dataType : 'json',
				success : callback,
				error : function(data, msg) {
					that.error("Error fetching bracket `"+ bracket +"`. Status: "+msg);
				}
			});
		},
		//
		//
		//
		loadStatsFromDB : function(type, id, callback, cache) {
			// Fetch stats from Database given object type and ID. (e.g., Squad, 1).
			var that = this;
			
			if(cache) {
				// Make sure cache is set up
				that.statsCache = that.statsCache || {};
				that.statsCache[type] = that.statsCache[type] || {};
				
				// Check cache for requested data
				if(that.statsCache[type][id]) {
					// If data is found in cache, return from cache without sending
					// request to server.
					callback(that.statsCache[type][id]);
					return;
				}
				
				var cb2 = callback;
				callback = function(data) {
					// Interceptive callback to cache data
					that.statsCache[type][id] = data;
					cb2(data);
				}
			}
			
			$.ajax({
				url : that.baseURL + 'fetchstats.py?type='+ type +'&id='+ id,
				dataType : 'json',
				success : callback,
				error : function(Data, msg) {
					that.error("Error fetching stats `"+ type +" / "+ id +"`. Status: "+ msg);
				},
			});
		},
		//
		//
		//
		adjustSizes : function() {
			// Get screen dimensions
			this.width = $(window).outerWidth(true);
			this.height = $(window).outerHeight(true);
			this.origin = new Point(this.width/2,
									this.height/2);
			// Calculate node width based on screen width
			this.nodeWidth = (2*this.nodeHPadding + this.width) / 11 - 2*this.nodeHPadding,
			this.nodeHeight = (2*this.nodeVPadding + this.height) / 35 - 2*this.nodeVPadding,
			this.nodeRadius = .3*this.nodeHeight;
		},
		//
		//
		//
		resize : function(e) {
			// Resize the Widget. Called on window.resize().
			var that = this;
			
			// Recalculate dimensions of screen and appropriate scaling
			that.adjustSizes();
			
			// Resize canvas
			that.paper.setSize(that.width,
							   that.height);
			
			// Adjust BG Size
			that.bg.attr('width', that.width)
				   .attr('height', that.height);
				   
			// Move Title
			that.titleLbl.attr('x', that.width/2).attr('y', that.height*that.titleYOffsetRat);	   
			
			// Move scoreLbl
			if(that.scoreLbl) {
				var titBox = that.titleLbl.getBBox();
				that.scoreLbl.attr('x', that.titleLbl.attr('x'))
							 .attr('y', titBox.y2 + that.scoreLblYPad);
			}
			
			// Re-layout bracket
			var fcnt = 0;
			that.nodes.forEach(function(me, i) {
				// Calculate and store new positions
				var coords = that.getLayoutParams(i);
				that.cacheNodeData(i, coords);
				// Adjust sizes
				me.rect.attr('width', that.nodeWidth).attr('height', that.nodeHeight);
				// Adjust positions
				me.rect.animate({'x': coords.rect.x, 'y':coords.rect.y},
								500, 'elastic', function() {
									// After the last node is finished animating, re-zoom on region
									// to make sure everything stays lined up correctly
									fcnt += 1;
									if(fcnt==that.nodes.length-1) {
										that.zoomOnRegion(that.state.region);
										that.createNavArrows(that.state.region);
									}
								});
				me.text.attr('x', coords.text.x).attr('y', coords.text.y);
				if(me.path) me.path.attr('path', coords.path.path);
			});
			
			// Move region labels
			that.regionLabels.forEach(function(me, i) {
				var coords = that.getLayoutParams(i+3);
				me.animate({
					'x': coords.rect.ix + (that.nodeWidth*(coords.rect.h>0? 1 : -1)),
					'y': coords.text.y
				}, 500, 'elastic');
			});
		},
		//
		//
		//
		layoutBracket : function(data) {
			// Layout the bracket using provided JSON data
			var that = this;
			this.data = data;
			this.nodes = [];
			
			function _(root) {
				// Recursive layout function
				var coords = that.getLayoutParams(root.id),
					rect = that.paper.rect(coords.rect.x, coords.rect.y,
								      	  that.nodeWidth, that.nodeHeight,
										  that.nodeRadius)
									 .attr('stroke-width', that.nodeStrokeWidth)
								     .attr('fill', that.nodeColor)
									 .attr('stroke', that.nodeStroke),
					text = that.paper.text(coords.text.x,
										   coords.text.y,
										   root.data.seed+" "+root.name)
										   .attr('text-anchor', 'start')
										   .attr('font-family', 'Source Sans Pro'),
					path = (root.id<=2)? null :
										 that.paper.path(coords.path.path)
										 		   .attr('stroke', that.pathColor);
				var node = that.nodes[root.id] = {
					// Manually keep track of objects since Raphael doesn't do so
					rect: rect,
					text: text,
					path: path,
					data: {}
				};
				
				that.cacheNodeData(root.id, coords);
				
				for(var key in root.data) {
					// Copy root's data to Raphael node
					node.data[key] = root.data[key];
				}
				
				
				// Create set exclusively for group event-handling. Ugly,
				// but otherwise would have to set listeners on items individually
				var sn = that.paper.set();
				sn.push(rect).push(text).push(path);
				sn.attr('cursor', 'pointer');
				
				sn.mouseover(function() {
					// Effects on current node
					node.rect.toFront();
					node.text.toFront();
					
					// Calculate next games
					var nextGames = that.getFutureTeamNodes(node.data.id),
						prevGames = that.getPastTeamNodes(node.data.id);
						
					prevGames.concat(nextGames).forEach(function(id, x, arr) {
						var isLastAndLost = (nextGames.length && x==arr.length-1 && id);
						that.nodes[id].rect.attr('fill', isLastAndLost? that.lostGameColor : that.teamPathColor);
					});
					
					// Animate scaling on current node
					node.rect.animate({
						'transform'     : transformStr = 's'+that.nodeHoverScale.x+','+that.nodeHoverScale.y,
						'stroke-width'  : strokeScale = that.nodeStrokeWidth*2
					}, 500, 'elastic');
					
					// Don't animate fill on current node, or else there'll be a race condition on mouse out
					node.rect.attr('fill', (!nextGames.length&&node.data.id)? that.lostGameHoverColor : that.nodeHoverColor);
					
					
					
					if(node.data.id>0) {
						// Find / highlight opponent path, if applicable
						var opponentID = node.data.id+(node.data.id%2? 1 : -1),
							nextGames = that.getFutureTeamNodes(opponentID),
							prevGames = that.getPastTeamNodes(opponentID);
							
						prevGames.concat(nextGames).forEach(function(id, x, arr) {
							var isLastAndLost = false && (nextGames.length && x==arr.length-1 && id>0)
							that.nodes[id].rect.attr('fill', isLastAndLost? that.lostGameColor : that.opponentPathColor);
						});
						
						// Highlight current game
						that.nodes[opponentID].rect.attr('fill',
														 false&&!nextGames.length? that.lostGameColor : that.opponentHoverColor);
					}
					
					// Adjust path going inward (towards championship)
					if(node.path) {
						var np = path.attr('path');
						np[0][1] = node.data.ox + ((node.data.h<0)? node.data.dx : -node.data.dx);
						node.path.attr('path', np);
					}
					
					// Adjust paths feeding into node from outside (from previous round)
					var noffset = node.data.id<<1;
					if(noffset<that.nodes.length) {
						for(var i=noffset+1;i<noffset+3;i++) {
							if(!that.nodes[i] || !that.nodes[i].path) continue;
							var np = that.nodes[i].path.attr('path');
							np[1][5] = node.data.ix + ((node.data.h<0)? -node.data.dx : node.data.dx);
							that.nodes[i].path.attr('path', np);
						}
					}
				}).mouseout(function() {
					// Revert node to normal size
					rect.animate({
						'transform'     : 's1,1',
						'stroke-width'  : that.nodeStrokeWidth
					}, 500, 'elastic');
					
					// Dehighlight all the highlighted nodes
					var nodeQueue = [node.data.id].concat(that.getFutureTeamNodes(node.data.id),
													      that.getPastTeamNodes(node.data.id))
					if(node.data.id>0) {
						// Find / highlight opponent path, if applicable
						var opponentID = node.data.id+(node.data.id%2? 1 : -1);
						nodeQueue = nodeQueue.concat([opponentID],
													 that.getFutureTeamNodes(opponentID),
													 that.getPastTeamNodes(opponentID));
					}
					
					nodeQueue.forEach(function(id) {
						that.nodes[id].rect.attr('fill', that.nodeColor);
					});
				
					// Adjust path going inward from node
					if(path) {
						var np = path.attr('path');
						np[0][1] = node.data.ox
						node.path.attr('path', np);
					}
					
					// Adjust paths coming into node from outer rounds
					var noffset = node.data.id<<1;
					if(noffset<that.nodes.length) {
						for(var i=noffset+1; i<noffset+3; i++) {
							if(!that.nodes[i] || !that.nodes[i].path) continue;
							var np = that.nodes[i].path.attr('path');
							np[1][5] = node.data.ix;
							that.nodes[i].path.attr('path', np);
						}
					}
				}) // end of mouseout
				.click(function() {
					// On click popup comparison overlay
					if(that.popup) {
						that.popup.destroy();
					}
					var t2id = node.data.id+(node.data.id%2? 1 : -1);
					that.popup = new Popup(that, node.data.sid, that.nodes[t2id].data.sid);
					that.popup.init();
				});
			
				
				// Layout children if they're present
				if(root.children!=false) {
					_(root.children[0]);
					_(root.children[1]);
				}
			} // end of _() recursive layout function
			
			// Initiate layout
			_(data);
			
			// Add region labels on same level as final four
			this.createRegionLabels();
		},
		//
		//
		//
		createRegionLabels : function() {
			var that = this;
			this.regionLabels = this.regions.map(function(region, i) {
					var anchorNode = that.nodes[i+3];
					return that.paper.text(anchorNode.data.ix
									       + (that.nodeWidth*(anchorNode.data.h>0? 1 : -1)),
										   anchorNode.rect.getBBox().y + (that.nodeHeight>>1),
										   region)
									 .attr('cursor', 'pointer')
									 .attr('font-size', '20px')
									 .click(function() {
									     that.zoomOnRegion(i, true);
									 });
					
				});
		},
		//
		//
		//
		zoomOnRegion : function(i, animate, rc) {
			 // Get elements at extremes of quadrant
			 var that = this;
			 
			 var x = y = 0,
			     w = this.width,
				 h = this.height;
				 
			 if(i>=0) {
				 // If i is region
				 var roffset = (1<<that.rounds)-1,
					 outId = roffset + i*(roffset+1)/that.regions.length,
					 innerId = i+3,
					 bottomId = roffset + (i+1)*(((roffset+1)/that.regions.length)-1);
				 // Find bounds from elements at extremes
				 var x1 = that.nodes[outId].data.ix,
					 x2 = that.nodes[innerId].data.ox,
					 y2 = that.nodes[bottomId].rect.getBBox().y2,
				y = that.nodes[outId].rect.getBBox().y;
				x = x1<x2? x1 : x2,
				w = (x2>x1? x2 : x1) - x
				h = y2 - y;
			}else if(i=='ff') {
				// Zoom on Championship
				var b1 = that.regionLabels[0].getBBox(), // upper left
					b2 = that.regionLabels[3].getBBox(); // lower right
				x = b1.x;
				y = b1.y;
				w = b2.x2 - x;
				h = b2.y2 - y;
			
				// Adjust proposed viewBox dimensions to fit aspect ratio
				// Note: Could do this for other regions, but Raphael handles
				// those errors ok
				rat = Math.max(that.width, that.height) / Math.min(that.width, that.height);
				if(that.width>that.height) {
					// Width might be too small
					var fullWidth = rat * h,
						diff = fullWidth - w;
					w = fullWidth;
					x -= diff/2;
				}else{
					// Height might be too small
					var fullHeight = rat * w,
						diff = fullHeight - h;
					h = fullHeight;
					y -= diff/2;
				}
			
			}
			if(rc) return [x, y, w, h];
			 
			 // Set View Area to region bounding box
			if(!animate) {
				that.paper.setViewBox(x, y, w, h, false);
			}else{
				// Animate the zoom. Use easing function specified
				// as object parameter.
				var curView = that.paper._viewBox || [that.paper._left, that.paper._top, that.paper.width, that.paper.height],
					dx = x - curView[0],
					dy = y - curView[1],
					dw = w - curView[2],
					dh = h - curView[3];
				var easingFunction = typeof that.zoomEasing=='function'? that.zoomEasing : Raphael.easing_formulas[that.zoomEasing];
				var delta = 15, // interval
					t = 0,
					maxSteps = that.zoomDuration / delta;
					
				(function _animateZoom(r) {
				
					// move one frame
					var d = (t>=maxSteps)? 1 : easingFunction(t/maxSteps);
					
					that.paper.setViewBox(curView[0] + dx*d,
										  curView[1] + dy*d,
										  curView[2] + dw*d,
										  curView[3] + dh*d, false);
					
					if(t++>=maxSteps) {
						clearInterval(that.zoomAnimation);
						if(i>=0) {
							// Create navigation arrows if zoomed in
							that.createNavArrows(i);
						}
						return;
					}
					
					if(r) that.zoomAnimation = setInterval(_animateZoom, delta);
				})(true);
			}
			
			// Keep current state
			that.state.region = i;
		},
		//
		//
		//
		createNavArrows : function(i, x, y, x2, y2) {
			var that = this;
			
			// Calculate layout parameters
			var vb = that.paper._viewBox,
				vbH = that.paper.height * that.paper._vbSize,		// Can't rely on VB's purported height!
				vbW = that.paper.width * that.paper._vbSize,		// Can't rely on VB's purported width!
				bounds = [x||vb[0], y||vb[1], x2||vb[0]+vbW, y2||vb[1]+vbH], // left top right bottom
				mx = (i>1)? 1 : -1,    // horizontal offset magnitude (negative for 0, 1)
				my = (i%2)? 1 : -1, // vertical offset magnitude
				cx = bounds[i>1? 0 : 2], // LEFT (0) for region Ids 2 and 3, RIGHT (2) for 0 and 1
				cy = bounds[(i%2)? 1 : 3],   // TOP (1) for region Ids 1 and 3, BOTTOM (3) for 0 and 2.
				delta = that.navButtonSize,
				h = Math.sqrt(2*Math.pow(delta, 2)),
				th = Math.sqrt(Math.pow(delta, 2) - Math.pow(h/2, 2));
			
			// Now make labels from regions
			var xLbl = that.regions[(i+2)%that.regions.length],
				yLbl = that.regions[i - my];
			
			// Make text elements
			that.navButtons.forEach(function(me) { me.remove(); });
			that.navButtons = [];
			
			// Make triangle that navigates HORIZONTALLY
			that.navButtons.push(that.paper.path('M '+ (cx+(th)*mx) +' '
													 + (cy+(delta+th)*my) +
												' l 0 '+ (my*h) +
												' l ' + -(th*mx) +' '+ (-my*h/2) +
												' z')
											.data('label', xLbl));
			
	
			// make triangle that navigates VERTICALLY
			that.navButtons.push(that.paper.path('M '+ (cx+(delta+th)*mx) + ' '
												     + (cy+(th)*my) +
												' l '+ (mx*h) +' 0 ' +
												' l '+ (-mx*h/2) +' '+ (-my*th) +
												' z')
											.data('label', yLbl));
								 
								 
			// Make triangle with point at center for CHAMPIONSHIP zoom button
			that.navButtons.push(that.paper.path('M '+ (cx+mx*th) +' '
													 + (cy+my*th) +
											    ' l 0 '+ delta*my +
												' l '+ delta*mx +' '+ (-delta*my) +
												' z')
											.data('label', 'Championship'));
								 
								 
			// Button for zooming out
			that.navButtons.push(that.paper.path('M '+ (cx+mx*(delta+th)) +' '
													 + (cy+my*(delta+th)) +
												' l 0 '+ (my*delta/2) +
												' l '+ (delta*mx/2) +' 0' +
												' l 0 '+ (-my*delta/2) +
												' z')
											.data('label', "Full"));
			
			that.navButtons.forEach(function(me) {
				me.attr('cursor', 'pointer')
				  .attr('fill', that.navButtonFill)
				  .attr('stroke', that.navButtonStroke)
				  .hover(function() {
					  	this.attr('fill', that.navButtonHoverFill)
					  	    .attr('stroke', that.navButtonHoverStroke);
				  	},
				  	function() {
						this.attr('fill', that.navButtonFill)
							.attr('stroke', that.navButtonStroke);
				  	})
				  .click(function() {
						var text = me.data('label'),
							to = text=='Championship'? 'ff' : that.regions.indexOf(text);
						that.navButtons.forEach(function(me) { me.remove(); });
						that.zoomOnRegion(to, true);
				});
			});
			
		},
		//
		//
		//
		getPastTeamNodes : function(id) {
			// Get an Array of node indexes in previous rounds of Team
			// specified by id.
			// Indexes are 0-indexed
			var nodes = [],
				sid = this.nodes[id].data.sid,
				n = (id+1)<<1;
			while((n-1)<this.nodes.length) {
				// (performing 1-indexed heap search operations on 0-indexed list)
				if(this.nodes[n-1].data.sid!=sid) n+=1;
				nodes.push(n-1);
				n <<= 1;
			}
			return nodes;
		},
		//
		//
		//
		getFutureTeamNodes : function(id) {
			// Get an array of future round appearances of team specified
			// by id.
			var n = id+1,
				sid = this.nodes[id].data.sid,
				nodes = [];
			while(n-1 > 0) {
				// (Performing 1-indexed heap operations on 0-indexed list)
				n >>= 1;
				if(this.nodes[n-1].data.sid!=sid) break;
				nodes.push(n-1);
			}
			return nodes;
		},
		//
		//
		//
		getNodeCoords : function(id, project) {
			// Get row and column of node in grid
			if(project===undefined) project = true;
			var point = null;
			
			if(id==0) {
				// Champion gets placed at the origin always.
				point = new Point(0,0);
			}else{
				// Heap operations are 1-indexed, id is 0-indexed. Adjust:
				var n = id+1;
				// Get round num
				var roid = log2(n),
					rinv = this.rounds-roid; // inverse of round id
				// Get Horizontal offset in tree
				var k = n - (1<<roid);
				// Get Region ID, adjust finalist teams specially
				var gs = (roid>1)? 1<<(roid-2) : 1;
				var reid = (roid>1)? k>>(roid-2) : k<<1;
				// Now calculate offset based on Round, Region, and Offset
				// - Decompose round ID into quadrant of bracket
				var hHalf = reid>1? 1 : -1,
					vHalf = reid%2? -1 : 1;
					
				var j = (vHalf>0? (gs-1) - (k%gs) : (k%gs));
				// Get Offset within region
				var i = (1<<rinv) * (j+.5) + 1 //+ ((n%2? -1:1)*(rinv)/2);
	
				// Adjust offset for finalist teams
				if(roid==1) i = (n%2)? -2 : 2;
				
				// Column is round ID in the correct quadrant,
				// and Row is `i` in the correct quadrant
				point = new Point(hHalf*(roid-1), vHalf*i);
				
				point.h = hHalf;
			}
	
			// Project onto screen coordinates if specified (by default, do it)
			if(project) {
				return this.projectPoint(point);
			}else{
				return point;
			}
		},
		//
		//
		//
		getPathFrom : function(a) {
			// Get the string to draw a path from a to b
			var str = "";
			if(!a) return str;
			
			var b = ((a + 1) >> 1) - 1;
			
			var yF = this.nodeHeight/2;
				aC = this.getNodeCoords(a),
				bC = this.getNodeCoords(b),
				x = aC.x,
				y = aC.y + yF,
				x2 = bC.x,
				y2 = bC.y + yF;
			
			// Fix point to left or right based on sign of dx
			if((x2-x)>0) {
				x += this.nodeWidth;
			}else{
				x2 += this.nodeWidth;
			}
			
			switch(this.pathType) {
				case 'smooth':
					// Currently only one supported. Makes a brace-like effect.
					str = "M"  + x  +","+ y +"C"+ (x2) +","
									            + (y)  +","
												+ (x)  +","
												+ (y2) +","
							   + x2 +","+ y2;
					break;
				default:
					str = "M"+ x +","+ y +"T"+ x2 +","+ y2;
			}
			
			return str;
		},
		//
		//
		//
		getLayoutParams : function(i) {
			var that = this;
			var np = that.getNodeCoords(i),
				bb = {
					x: np.x,
					x2: np.x+that.nodeWidth,
					y: np.y,
					y2: np.y+that.nodeHeight,
					width: that.nodeWidth,
					height: that.nodeHeight
				},
				ox = (np.h<0? bb.x2 : bb.x),
				ix = (np.h<0? bb.x : bb.x2),
				dx = bb.width*((that.nodeHoverScale.x-1)/2.0);
					
			return {
				rect : {
					x : np.x,
					y : np.y,
					h : np.h,
					ox : ox,
					ix : ix,
					dx : dx
				},
				text : {
					x : np.x + (that.nodeWidth/10),
					y : np.y + (that.nodeHeight>>1)
				},
				path : {
					path : that.getPathFrom(i)
				}
			};
		},
		//
		//
		//
		cacheNodeData : function(id, data) {
			// Cache layout information for quickly performing visual effects
			// such as the link-path movement on mouseover. The data param
			// is an object such as that passed by getLayoutParams
			this.nodes[id].data.id = id;    // is used by mouseover fns
			this.nodes[id].data.h = data.rect.h;
			this.nodes[id].data.ox = data.rect.ox;
			this.nodes[id].data.ix = data.rect.ix;
			this.nodes[id].data.dx = data.rect.dx;
		},
		//
		//
		//
		projectPoint : function(point) {
			// Project a Point in cartesian coordinates onto canvas coordinates
			var np = $.extend({}, new Point(null, null), point);
			var efwidth = this.nodeWidth + (this.nodeHPadding<<1),
				efheight = this.nodeHeight + (this.nodeVPadding<<1);
			np.x = this.nodeHPadding + (point.x * efwidth) + this.origin.x - (efwidth>>1);
			np.y = -(point.y * efheight) + this.origin.y - (efheight>>1);
			
			return np;
		},
		//
		//
		//
		correct : function(correctedBracket) {
			var that = this;
			if(correctedBracket===undefined) correctedBracket = that.correctedBracket;
			if(!correctedBracket) return;
			
			that.score = 0;
			var maxPoints = 0,
				totalPossible = 0;
			that.knockedOut = [];
			var anyGamesUnplayed = false;
			
			// Iterate through corrected bracket and correct.
			for(var i=((1<<that.rounds)-2); i>=0; i--) {
				console.log(that.knockedOut);
				var r = log2(i+1)
				
				if(that.correctedBracket[i].data.sid==null) {
					// Game hasn't been played yet
					anyGamesUnplayed = true
					if (that.knockedOut.indexOf(that.nodes[i].data.sid)<0) {
						// Chosen team hasn't been knocked out yet, so points
						// are still possible
						totalPossible += that.scores[r];
					}else{
						// Team has been knocked out. Cross it out.
						that.nodes[i].text.attr('fill', null);
						that.nodes[i].text.node.setAttribute('class', that.textIncorrectCls);
					}
					continue;
				}else if(that.correctedBracket[i].data.sid==that.nodes[i].data.sid) {
					// Bracket is correct
					that.nodes[i].text.attr('fill', null);
					that.nodes[i].text.node.setAttribute('class', that.textCorrectCls);
					that.score += that.scores[r];
					
					// Total possible score for this bracket includes points already won
					totalPossible += that.scores[r];
				}else{
					// Bracket is incorrect
					that.nodes[i].text.attr('fill', null);
					that.nodes[i].text.node.setAttribute('class', that.textIncorrectCls);
					
					// Add incorrect id to knockedOut Array
					that.knockedOut.push(that.nodes[i].data.sid);
				}
				// Calculate how many points could have been scored so far
				maxPoints += that.scores[r];
			}
			
			// Set score label to display score
			if(that.scoreLbl){
				var txt = 'Scored '+that.score+' out of '+ maxPoints +'.';
				if(anyGamesUnplayed) {
					txt += " Bracket's best possible score now is "+totalPossible+".";
				}
				that.scoreLbl.attr('text', txt);
			}
		},
		//
		//
		//
		error : function(msg) {
			if(this.paper==null) {
				this.adjustSizes();
				this.paper = Raphael(0, 0, this.width, this.height);
			}
			var e = this.paper.text(this.width/2,
									this.height/2,
									"Error: "+msg)
							  .attr('text-anchor', 'middle')
							  .attr('fill', 'red');
		},
		//
		//
		//
	}; // End of object
	//
	//
	//
	// Extend object with custom parameters and return it
	return $.extend({}, obj, params);
}









// Popup window (to display stats and stuff)
function Popup(master, teamOneId, teamTwoId) {
	return {
		master    : master,
		teams     : [teamOneId, teamTwoId],
		width     : master.width>>1,
		height    : master.height>>1,
		x	      : master.width>>2,
		y	      : master.height>>2,
		// content
		template  : "<table id='stats'><thead><tr id='name'><th></th><th class='team-1'></th><th class='team-2'></th></tr></thead> <tbody></tbody></table>",
		// containers
		me		  : null,
		dataRows  : null,
		tableID	  : '#stats',
		target	  : '#statbox',
		retrieved : 0,
		data      : [],
		labels    : {
			"rpi"			        : "Naïve Strength of Schedule (RPI)",
			"ls"					: "Least Squares Rating",
			"wins"				    : "Wins",
			"losses"				: "Losses",
			"wp"					: "Unweighted Winning %",
			"wwp"			        : "Weighted Winning %",
			"field_goals_attempted" : "Total Field Goals Attempted",
			"field_goals_made"		: "Total Field Goals Made",
			"fg_pct"                : "Field Goal Shooting %",
			"looks_avg"				: "Field Goals Taken Per Game (avg.)",
			"field_goal_avg"        : "Field Goals Made Per Game (avg.)",
			"threes_attempted"      : "Total 3 Ptrs Shot",
			"threes_made"			: "Total 3 Ptrs Made",
			"threes_pct"            : "3 Pt. Shooting %",
			"threes_avg"			: "3 Ptrs Per Game (avg.)",
			"points_avg"			: "Points Per Game (avg.)",
			"points"				: "Total Points Score",
			"lpm"					: "Field Goals Taken Per Minute (avg.)",
			"ppm"			        : "Points Per Minute (avg.)",
			"assists"				: "Total Assists", 
			"assists_avg"			: "Assists Per Game (avg.)",
			"free_throws_attempted" : "Total Free Throws Shot",
			"free_throws_made"      : "Total Free Throws Made",
			"ft_pct"				: "Free Throw Shooting %",
			"free_throws_avg"       : "Free Throws Per Game (avg.)",
			"turnovers"				: "Total Turnovers",
			"turnovers_avg"         : "Turnovers Per Game (avg.)",
			"steals"			    : "Total Steals",
			"steals_avg"		    : "Steals Per Game (avg.)",
			"blocks"				: "Total Blocks",
			"blocks_avg"			: "Blocks (avg.)",
			"rebounds"				: "Total Rebounds",
			"rebounds_avg"			: "Rebounds Per Game (avg.)",
			"defensive_rebounds"    : "Total Defensive Rebounds",
			"offensive_rebounds" 	: "Total Offensive Rebounds",
			"fouls"					: "Total Fouls",
			"fouls_avg"			    : "Fouls Per Game (avg.)",
		},
		//
		//
		// Functions
		//
		//
		init : function() {
			var that = this;
			
			// Create dialog
			
			if(!$(this.target).length) {
				// Create target element if needed
				$('body').append('<p id="'+this.target.substring(1)+'">');
			}
			
			if(!$(this.tableID).length) {
				// Create table
				$(this.target).append(this.template);
			}
			
			this.me = $(this.target);
			
			this.me.dialog({
				autoOpen : true,
				closeOnEscape: true,
				draggable: true,
				height: that.height,
				width: that.width,
				modal: true,
				position: {my: 'center', at: 'center', of: window},
				resizable: true,
				title : "Loading stats ...",
			});
			
			if(!that.dataRows) that.makeDataRows();
			
			that.setLoading(true, 'both');
			
			this.retrieved = 0;
			// Load stats from DB and display in box.
			this.teams.forEach(function(sid, i) {
				that.master.loadStatsFromDB('squad', sid,
					function(data) {
						that.setLoading(false, 'team-'+(i+1), data.name);
						
						that.displayStats(data, i+1);
						
						that.retrieved++;
						if(that.retrieved==that.teams.length) {
							that.updateTitle();
						}
					}, true);
			});
			
		},
		//
		//
		//
		setLoading : function(switch_, target, newTitle) {
			// Set loading animation on columns in dialog boxes (first, second, both)
			var that = this;
			if(target===undefined) target = 'both';
			target = target.toLowerCase();
			
			function _loadingText(flag, $target) {
				if($target) that[flag+'$T'] = $target;
				if(that[flag]===undefined) that[flag] = true;
				if(that[flag+'Cnt']===undefined) that[flag+'Cnt'] = -1;
				
				// Increment counter
				that[flag+'Cnt']++;
				var i = that[flag+'Cnt'],
					$t = that[flag+'$T'];
				
				// Display text in $target ($t) based on counter
				var text = "Loading ",
					p = ".";
				
				var np = ~~(i/30)%4;
				for(var x=0; x<np; x++) text+=p;
				
				$t.text(text);
				
				if(that[flag]==false) {
					// Stop running when external flag is set to false
					clearInterval(that[flag+'Interval']);
					// Set column title to specified title
					$t.text(that[flag+"nt"]);
					// Clean up namespace
					for(var key in that) {
						if(key.substring(0, flag.length)==flag) {
							delete that[key];
						}
					}
					return;
				}
				
				if($target) {
					// Initiate animation
					that[flag+'Interval'] = setInterval(function() { _loadingText(flag); }, 20);
				}
			}
			
			function _dispatch(s, t, nt) {
				// Dispatch loading animation. Call with "true" or "false" for s
				// to turn animation on or off. 't' should be the column number.
				var $t = $('#name .team-'+t),
					f = "_isLoading_"+t+"_";
				if(nt!==undefined) that[f+"nt"] = nt;
				that[f] = s;
				if(s) {
					$t.css('text-align', 'left');
					_loadingText(f, $t);
				}else{
					$t.css('text-align', 'center');
				}
			}
			
			// Direct input to animation.
			if(target=='first' || target=='team-1' || target=='both') {
				_dispatch(switch_, 1, newTitle);
			}
			if(target=='second' || target=='team-2' || target=='both') {
				_dispatch(switch_, 2, newTitle);
			}
		},
		//
		//
		//
		makeDataRows : function() {
			// Make table rows based on labels
			this.dataRows = {};
			var tbody = $(this.tableID).find('tbody');
			for(var key in this.labels) {
				tbody.append($("<tr id='"+ key +"'><th>"+ this.labels[key] +"</th><td class='team-1 val'></td><td class='team-2 val'></td></tr>"));
				this.dataRows[key] = $(this.tableID+' #'+key);
			}
		},
		//
		//
		//
		displayStats : function(data, num) {
			// Display stats in table in dialog
			var table = $(this.tableID);
			this.data.push(data);
			
			table.find('#name .team-'+num).text(data.name);
			
			for(var key in this.labels) {
				var fnum = data.stats[key].toPrecision(4);
				if(this.dataRows[key].text().indexOf("%")>-1) {
					// Take the hint that this number should be a percentage
					fnum = (fnum*100).toPrecision(4) + "%";
				}
				this.dataRows[key].find('.team-'+num).text(fnum);
			}
			
		},
		//
		//
		//
		updateTitle : function() {
			// Update title of dialog to be specific
			this.me.dialog('option', 'title', 'Season stats for '+ this.data[0].name + ' ('+ this.data[0].season +') and '+ this.data[1].name +' ('+ this.data[1].season +')');
		},
		//
		//
		//
		destroy : function() {
			this.me.dialog('destroy');
			$(this.target).empty();
			// Remove the reference to this object on master.
			// Do this to make it obvious to the program that there is currently
			// no popup. Also breaks the reference so popup object can be swept.
			delete master.popup;
		}
	};
}




// Helper functions

function Point(x, y) {
	return {
		x: x,
		y: y
	}
}

function log2(x) {
	// quick integer log base 2
	var n = -1;
	while(x>0) {
		n+=1;
		x>>=1;
	}
	return n;
}




// Initialization on load
$(function() {
	// Fonts
	WebFontConfig = {
    google: { families: [ 'Source+Sans+Pro:400,700:latin' ] }
  };
  
  (function() {
	  // Google Font loader
    var wf = document.createElement('script');
    wf.src = ('https:' == document.location.protocol ? 'https' : 'http') +
      '://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js';
    wf.type = 'text/javascript';
    wf.async = 'true';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(wf, s);
  })();
});
