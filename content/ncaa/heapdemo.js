/**
 * heapdemo.js
 * An SVG built with RaphaelJS that demonstrates
 * compact storage of binary heaps.
 *
 * Copyright (c) 2013 Joseph Nudell.
 */

function HeapDemo(params) {
	if(params===undefined) params = {};
	
	var obj = {
		// Node Params
		nodeColor	    : '#FCD3B1',
		nodeHoverColor  : 'rgb(92, 199, 92)',
		linkColor  		: 'rgb(142, 202, 202)',
		relatedNodeColor: 'rgb(22, 242, 104)',
		linkWidth       : 1,
		linkHoverWidth  : 3,
		width : 600,
		height: 200,
		speed : 600,
		x : 0,
		y : 0,
		//
		//
		paper : null,
		nodes : null,
		paths : null,
		r : null,
		d : null,
		n : null,
		padding: 2,
		container : null,
		//
		//
		//
		// Functions
		//
		//
		//
		create : function(n) {
			var that = this;
			if(n===undefined) n = 7;
			that.n = n;
			
			// Destroy old nodes if necessary
			if(that.nodes!=null) {
				that.nodes.forEach(function(me) {
					if(me.a) me.a.remove();
					if(me.b) me.b.remove();
					me.c.remove();
					me.t.remove();
				});
			}
			that.nodes = [];
			that.paths = [];
			
			// Create new SVG
			if(!that.paper) {
				if(that.container) {
					that.paper = Raphael(that.container, that.x, that.y, that.width, that.height);
				}else{
					that.paper = Raphael(that.x, that.y, that.width, that.height);
				}
			}
			
			that.r = that.width / (4*n);
			that.d = 2*that.r;
			
			for(var i=1; i<n+1; i++) {
				// Layout circles
				var coords = that.getCoords(i),
					path1 = that.makePath(i, 0),
					path2 = that.makePath(i, 1);
				
				var circle = that.paper.circle(coords.cx, coords.cy, that.r)
									   .attr('fill', that.nodeColor);
									  
				var text = that.paper.text(coords.cx, coords.cy, i)
									 .attr('text-anchor', 'middle');
				
				
				
				function _onHover(mainColor, relatedColor, strokeWidth) {
					var i = this.data('i');
					that.nodes[i].c.attr('fill', mainColor);
					
					if(that.nodes[i].a) {
						that.nodes[i].a.attr('stroke-width', strokeWidth);
					}
					if(that.nodes[i].b) {
						that.nodes[i].b.attr('stroke-width', strokeWidth);
					}
					
					var child2 = ((i+1)<<1),
						child1 = child2-1;
						
					if(child1<that.nodes.length) {
						that.nodes[child1].c.attr('fill', relatedColor);
					}
					if(child2<that.nodes.length) {
						that.nodes[child2].c.attr('fill', relatedColor);
					}
				}
				
				
				
				var s = that.paper.set();
				s.push(circle).push(text).data('i', i-1).attr('cursor', 'pointer')
					.hover(function() {
						_onHover.call(this, that.nodeHoverColor, that.relatedNodeColor, that.linkHoverWidth);
					}, function() {
						_onHover.call(this, that.nodeColor, that.nodeColor, that.linkWidth);
					});
				
				that.nodes.push({
					cx : coords.cx,
					cy : coords.cy,
					acx : coords.acx,
					acy : coords.acy,
					d : coords.d,
					c : circle,
					t : text,
					a : path1,
					b : path2,
					s : s
				});
				
			} // End of element creation for-loop
			
			// Set event listeners for the path
			eve.on("raphael.anim.frame.*", function() {
				// Move paths along with their nodes as nodes are animated
				that.paths.forEach(function(me, i) {
					var parent = that.nodes[me.p-1],
						child = that.nodes[me.c-1],
						pcx = parent.c.attr('cx'),
						pcy = parent.c.attr('cy'),
						ccx = child.c.attr('cx'),
						ccy = child.c.attr('cy');
					
					var tp = dist(parent.cx, pcx, parent.cy, pcy);
						tc = dist(child.cx, ccx, child.cy, ccy);
					
					var dp = tp / parent.d,
						dc = tc / child.d;
					
					var myPath = me.path.attr('path');
					myPath[0] = ["M", pcx, pcy];
					myPath[1] = ["S", ccx, (pcy + (ccy-pcy)/2)
										  + dc * ((me.p%2)?-1:1) * (~~(i/2)) * (2*that.d),
								 	  ccx, ccy];
					me.path.attr('path', myPath);
				});
			});
			
			return this;
			
		},
		//
		//
		//
		start : function() {
			var that = this;
			
			(function _moveNodes(to, i) {
				if(to===undefined) to = 0;
				if(i===undefined) i = (to%2)? 0 : that.n-1;
				var inc = (to%2)? 1 : -1;
				
				if(i>=that.n || i<0) return _moveNodes(to+1);
				
				var newX, newY;
				if(to%2) {
					newX = that.nodes[i].acx;
					newY = that.nodes[i].acy;
				}else{
					newX = that.nodes[i].cx;
					newY = that.nodes[i].cy;
				}
				
				that.nodes[i].c.animate({
					cx : newX,
					cy : newY
				}, that.speed, 'elastic');
				
				that.nodes[i].t.animate({
					x : newX,
					y : newY
				}, that.speed, 'elastic', function() { _moveNodes(to, i+inc) });
				
			})(1);
			
			return this;
		},
		//
		//
		//
		getCoords : function(i) {
			var that = this;
			var row = log2(i),
				gs = 1<<row,
				k = i - (1<<row),
				xoffset = that.width / (gs+1),
				yoffset = that.height / (log2(that.n)+1),
				cx = (k+1)*xoffset,
				cy = (row+.5)*yoffset;
				acx = that.d * (i-1) + that.d*2  + (i-1)*10;
				acy = that.height/2;
			return {cx: cx,
					cy: cy,
					acx: acx,
					acy: acy,
					d : dist(cx, acx, cy, acy)
				};
		},
		//
		//
		//
		makePath : function(i, k) {
			var that = this;
			var baseChild = i<<1;
			
			if(baseChild+k<=that.n) {
				var myCoords = that.getCoords(i),
					childCoords = that.getCoords(baseChild+k);
				var parr = ["M", myCoords.cx, myCoords.cy,
							"S", childCoords.cx,
								 myCoords.cy + (childCoords.cy-myCoords.cy)/2,
								 childCoords.cx, childCoords.cy];
				var path = that.paper.path(parr)
							   .attr('stroke', that.linkColor)
							   .attr('stroke-width', that.linkWidth);
				that.paths.push({
					path : path,
					p : i,
					c : baseChild+k
				});
				return path;
			}
			
			return null;
		}
	};
	
	return $.extend({}, obj, params);
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

function dist(x1, x2, y1, y2) {
	return Math.sqrt(Math.pow(x1-x2, 2) + Math.pow(y1-y2, 2));
}