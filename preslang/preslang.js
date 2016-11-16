var jn = jn || {};

jn.Chart = function () {
	return {
		//
		//
		//
		// Globals
		//
		//
		//
		dataPath			: '/sandbox/preslang/preslang.tsv',
		widgetContainer		: $('#jn-widget-container'),
		margin				: {top: 20, right: 20, bottom: 30, left: 40},
    	width				: 800,
    	height				: 400,
		svg					: {},
		x					: {},
		y					: {},
		xAxis				: {},
		yAxis				: {},
		presLabel			: [],
		trendLine			: {a: 0.0028, b: -0.2117, c: 4.7076},
		livingPresidents	: ['Barack Obama', 'Bill Clinton', 'George W. Bush', 'George H. W. Bush', 'Jimmy Carter'],
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
			
			that.widgetContainer.html('<div id="jn-chart"></div>');
	
			that.x = d3.scale.ordinal()
				.rangeRoundBands([0, that.width], .1);
				
			that.y = d3.scale.linear()
				.range([that.height, 0]);
			
			that.xAxis = d3.svg.axis()
				.scale(that.x)
				.orient('bottom');
				
			that.yAxis = d3.svg.axis()
				.scale(that.y)
				.orient('left');
			
			that.svg = d3.select('#jn-chart')
				.append('svg')
					.attr('width', that.width + that.margin.right + that.margin.left)
					.attr('height', that.height + that.margin.top + that.margin.bottom)
				.append('g')
					.attr('transform', 'translate('+ that.margin.left +", "+ that.margin.top +")");
					
			// Create a text field for displaying name of president on hover
			that.presLabel = that.svg.append('text')
				.attr('class', 'presname')
				.attr('transform', 'translate(100, 10)')
				.attr('dy', '.71em')
				.style('text-anchor', 'start')
				.text('');
			
			d3.tsv(that.dataPath, function(error, data) {
				data.forEach(function (d, i) {
					d.estimate = false;
					if (typeof d.langscore == 'string' && d.langscore == 'Unknown') {
						d.langscore = (that.trendLine.a * (i*i))
									+ (that.trendLine.b * i)
									+ that.trendLine.c;
						d.estimate = true;
					}
					d.langscore = +d.langscore
				});
				
				
				var xDomain = [];
				for(var i=0; i<data.length; i++) xDomain.push(i+1);
				
				that.x.domain(xDomain);
				that.y.domain([0, d3.max(data, function (d) { return d.langscore; })]);
				
				// Create x-axis
				that.svg.append('g')
					.attr('class', 'x axis')
					.attr('transform', 'translate(0, '+that.height+')')
					.call(that.xAxis);
					
				// Create y-axis
				that.svg.append('g')
					.attr('class', 'y axis')
					.call(that.yAxis)
					.append('text')
						.attr('transform', 'rotate(-90)')
						.attr('y', 6)
						.attr('dy', '.71em')
						.style('text-anchor', 'end')
						.text('Language score');
				
				// Create bars
				that.svg.selectAll('.bar')
					.data(data)
				.enter()
					.append('rect')
						.attr('class', 'bar')
						.attr('x', function (d) { return that.x(d.name); })
						.attr('width', that.x.rangeBand())
						.attr('y', function (d) { return that.y(d.langscore); })
						.attr('height', function (d) { return that.height - that.y(d.langscore); })
						.style('fill', function (d) { return (d.estimate)? '#999' : '#58b'; })
					.on('mouseover', function (d) {
						that.presLabel.text(d.name);
						var me = d3.select(this);
						var curColor = d3.hsl(me.style('fill'));
						me.style('fill', curColor.brighter());
					})
					.on('mouseout', function (d) {
						that.presLabel.text('');
						var me = d3.select(this);
						var curColor = d3.hsl(me.style('fill'));
						me.style('fill', curColor.darker());
					});
				
				
				// Create the trend-line (2nd order polynomial)
				that.svg.selectAll('.trend')
					.data([that.trendLine])
				.enter()
					.append('path')
						.attr('class', 'trend')
						.attr('d', function (d) {
							// Create bezier from 2nd order polynomial
							var startpoint = { x: 1, y: d.a+d.b+d.c },
								controlpoint = { x: 0, y: 0 },
								endpoint = { x: data.length, y: 0 };
							
							// Calculate end point of curve on y-axis (x is known)
							endpoint.y = (d.a * (endpoint.x*endpoint.x))
										+ (endpoint.x * d.b) + d.c;	
							
							// Calculate control point
							controlpoint.x = Math.round((endpoint.x + startpoint.x) / 2);
							controlpoint.y = (d.a*endpoint.x*startpoint.x) + (.5*d.b*(endpoint.x+startpoint.x)) + d.c;
							
							// Construct SVG quadratic bezier path
							var path = "M " + that.x(startpoint.x)
									   + " "+ that.y(startpoint.y) + " " +
									   "Q " + that.x(controlpoint.x)
									   + " "+ that.y(controlpoint.y)
									   + " "+ that.x(endpoint.x)
									   + " "+ that.y(endpoint.y);
						
							return path;
						})
						.style('stroke', '#f00')
						.style('stroke-width', 1)
						.style('fill', 'none');
			});
			
			
		}
	};
};

jn.create = function () {
	var chart = new jn.Chart;
	chart.init();
	return chart;
};