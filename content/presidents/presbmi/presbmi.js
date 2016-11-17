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
		dataPath			: '/sandbox/presidents/presbmi/presbmi.tsv',
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
		trendLine			: {x2: -0.013, x: 0.6663, c: 19.151},
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
				.attr('transform', 'translate(60, 10)')
				.attr('dy', '.71em')
				.style('text-anchor', 'start')
				.text('');
			
			d3.tsv(that.dataPath, function(error, data) {
				data.forEach(function (d, i) {
					d.estimate = false;
					if (typeof d.bmi == 'string' && d.bmi == 'Unknown') {
						d.bmi = (that.trendLine.x2 * (i*i))
								+ (that.trendLine.x * i)
								+ that.trendLine.c;
						d.estimate = true;
					}
					d.bmi = +d.bmi
				});
				
				
				var xDomain = [];
				for(var i=0; i<data.length; i++) xDomain.push(i+1);
				
				that.x.domain(xDomain);
				that.y.domain([0, d3.max(data, function (d) { return d.bmi; })]);
				
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
						.text('Body Mass Index');
				
				// Create bars
				that.svg.selectAll('.bar')
					.data(data)
				.enter()
					.append('rect')
						.attr('class', 'bar')
						.attr('x', function (d) { return that.x(d.name); })
						.attr('width', that.x.rangeBand())
						.attr('y', function (d) { return that.y(d.bmi); })
						.attr('height', function (d) { return that.height - that.y(d.bmi); })
						.style('fill', function (d) { return (d.estimate)? '#999' : '#58b'; })
					.on('mouseover', function (d) {
						var weightClassText = "underweight";
						if (d.bmi>30) weightClassText = "obese";
						else if (d.bmi>25) weightClassText = "overweight";
						else if (d.bmi>18.5) weightClassText = "a healthy weight";
						
						var verb = "was"
						if(that.livingPresidents.indexOf(d.name)>-1) verb = "is";
						
						that.presLabel.text(d.name+". BMI: " + Math.round(d.bmi) + (d.estimate? ' (estimate)' : '')
											+ '. He '+verb+' ' + weightClassText + '.');
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
				
				// Create lines for underweight, overweight, and obese
				that.svg.selectAll('.guide')
					.data([
						{
							label : 'Underweight',
							value : 18.5
						},
						{
							label : 'Overweight',
							value : 25
						},
						{
							label : 'Obese',
							value : 30
						}
					])
				.enter()
					.append('g')
						.attr('class', 'guide')
						.append('line')
							.attr('x1', that.x(data[0].name))
							.attr('x2', that.x(data.length))
							.attr('y1', function (d) { return that.y(d.value); })
							.attr('y2', function (d) { return that.y(d.value); })
							.style('stroke-width', 1)
							.style('stroke', '#900')
							.style('opacity', '.6');
				
				// Create the trend-line (2nd order polynomial)
				that.svg.selectAll('.trend')
					.data([that.trendLine])
				.enter()
					.append('path')
						.attr('class', 'trend')
						.attr('d', function (d) {
							// Create bezier from 2nd order polynomial
							var startpoint = { x: 1, y: d.c, m: 0, b: 0},
								controlpoint = { x: 0, y: 0 },
								endpoint = { x: data.length, y: 0, m: 0, b: 0};
							
							// Calculate end point of curve on y-axis (x is known)
							endpoint.y = (d.x2 * (endpoint.x*endpoint.x))
										+ (endpoint.x * d.x) + d.c;	
							
							// Calculate slope at start and end using first-order derivative
							var y_prime = function (x) { return (2 * d.x2 * x) + d.x; };
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
							controlpoint.x = Math.round((endpoint.b - startpoint.b) / (startpoint.m - endpoint.m));
							controlpoint.y = (startpoint.m * controlpoint.x) + startpoint.b;
							
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
				
				// Add labels of guide lines to appear above everything else
				d3.selectAll('g.guide')
					.append('text')
						.attr('transform', function (d) {
							return 'translate('+(that.x(1)-18)+', '+(that.y(d.value)-10)+')';
						})
						.attr('dy', '.71em')
						.style('text-anchor', 'start')
						.style('opacity', .7)
						.text(function(d) { return d.label; });
				
			});
			
			
		}
	};
};

jn.create = function () {
	var chart = new jn.Chart;
	chart.init();
	return chart;
};