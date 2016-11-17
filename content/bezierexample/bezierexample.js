var jn = jn || {};

jn.BezierChart = function () {
	return {
		//
		//
		//
		// Globals
		//
		//
		//
		widgetContainer		: $('#jn-widget-container-1'),
		chartID				: 'jn-chart-1',
		margin				: {top: 20, right: 20, bottom: 30, left: 40},
    	width				: 660,
    	height				: 350,
		svg					: {},
		x					: {},
		y					: {},
		xAxis				: {},
		yAxis				: {},
		trendLine			: {a: 1, b: -4, c: 4},
		startPoint			: [],
		endPoint			: [],
		controlPoint		: [],
		points				: [],
		pointRadius			: 5,
		pointColor			: '#900',
		delta				: -.25,
		//
		//
		//
		// Methods
		//
		//
		//
		init : function () {
			var that = this;
			
			that.width = that.width - that.margin.left - that.margin.right;
			that.height = that.height - that.margin.top - that.margin.bottom;
			
			that.widgetContainer.html('<div id="'+that.chartID+'"></div>');
	
			that.x = d3.scale.linear()
				.range([0, that.width]);
				
			that.y = d3.scale.linear()
				.range([that.height, 0]);
			
			that.xAxis = d3.svg.axis()
				.scale(that.x)
				.orient('bottom');
				
			that.yAxis = d3.svg.axis()
				.scale(that.y)
				.orient('left');
			
			d3.select('#'+that.chartID)
				.append('svg')
					.attr('width', that.width + that.margin.right + that.margin.left)
					.attr('height', that.height + that.margin.top + that.margin.bottom)
				.append('defs')
					.append('marker')
						.attr('id', 'line-end')
						.attr('viewBox', '0 0 10 10')
						.attr('refX', 0)
						.attr('refY', 5)
						.attr('markerUnits', 'strokeWidth')
						.attr('markerWidth', 10)
						.attr('markerHeight', 8)
						.attr('orient', 'auto')
						.append('path')
							.attr('d', 'M 0 0 L 10 5 L 0 10 z')
							.style('fill', '#900');
					
			that.svg = d3.select('svg')
				.append('g')
					.attr('transform', 'translate('+ that.margin.left +", "+ that.margin.top +")");
			
			that.x.domain([0, 4]);
			that.y.domain([-5, 5]);
			
			// Create x-axis
			that.svg.append('g')
				.attr('class', 'x axis')
				.attr('transform', 'translate(0, '+(that.height/2)+')')
				.call(that.xAxis);
				
			// Create y-axis
			that.svg.append('g')
				.attr('class', 'y axis')
				.call(that.yAxis)
			
			// Create the trend-line (2nd order polynomial)
			that.svg.selectAll('.trend')
				.data([that.trendLine])
			.enter()
				.append('path')
					.attr('class', 'trend')
					.attr('d', function (d) {
						// Create bezier from 2nd order polynomial
						var startpoint = { x: 0, y: d.c, m: 0, b: 0, label: "P", subscript: "s"},
							controlpoint = { x: 0, y: 0 , label: "P", subscript: "c"},
							endpoint = { x: 4, y: 0, m: 0, b: 0, label: "P", subscript: "f"};
						
						// Calculate end point of curve on y-axis (x is known)
						endpoint.y = (d.a * (endpoint.x*endpoint.x))
									+ (endpoint.x * d.b) + d.c;	
						
						// Calculate slope at start and end using first-order derivative
						var y_prime = function (x) { return (2 * d.a * x) + d.b; };
						startpoint.m = y_prime(startpoint.x);
						endpoint.m = y_prime(endpoint.x); 
						
						// Calculate y-intercepts of start and end points using slope
						var b = function (point) { return point.y - point.m*point.x; };
						startpoint.b = b(startpoint);
						endpoint.b = b(endpoint);
						
						// Calculate control point as intersection of lines drawn using
						// the slopes of the start and end points and intercepts calculated
						// from coordinates of point. Set y and x equal to each other, solve for x.
						// Then plug in x to original equation to reveal y.
						// Note: round x value since domain is discrete (non-continuous)
						controlpoint.x = (endpoint.b - startpoint.b) / (startpoint.m - endpoint.m);
						controlpoint.y = (startpoint.m * controlpoint.x) + startpoint.b;
						
						// Construct SVG quadratic bezier path
						var path = "M " + that.x(startpoint.x)
								   + " "+ that.y(startpoint.y) + " " +
								   "Q " + that.x(controlpoint.x)
								   + " "+ that.y(controlpoint.y)
								   + " "+ that.x(endpoint.x)
								   + " "+ that.y(endpoint.y);
								   
						that.startPoint = startpoint;
						that.controlPoint = controlpoint;
						that.endPoint = endpoint;
					
						return path;
					})
					.style('stroke', '#f00')
					.style('stroke-width', 1)
					.style('fill', 'none');
					
			// Add circles at key points: start point, control point, and end point.
			that.points = that.svg.selectAll('.point')
				.data([that.startPoint, that.controlPoint, that.endPoint])
			.enter()
				.append('g')
				.attr('class', 'point');
			that.points
				.append('circle')
				.attr('cx', function (d) { return that.x(d.x); })
				.attr('cy', function (d) { return that.y(d.y); })
				.attr('r', that.pointRadius)
				.style('fill', that.pointColor);
			that.labels = that.points
				.append('text')
					.attr('y', function (d) { return that.y(d.y) - 5;} )
					.attr('x', function (d) { return that.x(d.x) + 10;} )
					.attr('dy', '.71em')
					.style('text-anchor','start' );
			that.labels
				.append('tspan')
				.text(function (d) { return d.label } );
			that.labels
				.append('tspan')
				.attr('baseline-shift', 'sub')
				.text(function (d) { return d.subscript } );
			
			var calcX = function (d) {
				var delta = (d.m>0)? -that.delta : +that.delta;
				var newX = Math.round(d.x + delta);
				newX = ((newX<0)? 0 : (newX>43)? 43 : newX);
				return newX;
			};
			
			that.svg.selectAll('.tangent')
				.data([that.startPoint, that.endPoint])
			.enter()
				.append('line')
				.attr('x1', function (d) {
					return that.x(d.x);
				})
				.attr('x2', function (d) {
					var x = that.controlPoint.x + ((d.m>0)? +that.delta: -that.delta);
					return that.x(x);
				})
				.attr('y1', function (d) {
					return that.y(d.y);
				})
				.attr('y2', function (d) {
					var x = that.controlPoint.x + ((d.m>0)? +that.delta: -that.delta);
					var y = d.m * x + d.b;
					return that.y(y);
				})
				.style('stroke-width', '1px')
				.style('stroke-dasharray', '4, 2')
				.style('stroke', '#900')
				.style('opacity', .6)
				.style('marker-end', 'url(#line-end)');
					
			
			
		}
	};
};

jn.BezierDiagram = function () {
	var chart = new jn.BezierChart;
	chart.init();
	return chart;
};