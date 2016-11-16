var jn = jn || {};


jn.IESankeyChart = function() {
	return {
		//
		//
		//
		// Settings
		//
		//
		//
		height 			: 600,
		width			: 800,
		target			: "#sankey",
		nodeWidth		: 10,
		nodePadding		: 10,
		treeSource		: "/sandbox/ss/synie.php?x=tree&r=germanic",
		//
		//
		//
		// Private Variables
		//
		// Containers
		//
		svg 			: {},
		sankey			: {},
		path			: {},
		// Data arrays
		allLinks		: [],
		geneticLinks	: [],
		contactLinks	: [],
		nodes			: [],
		//
		//
		//
		// Functions
		//
		//
		//
		init : function(callback) {
			var that = this;
			// Create SVG on screen
			this.svg = d3.select(this.target).append("svg")
				.attr("width", this.width)
				.attr("height", this.height)
			.append("g")
				.attr("transform", "translate(" + 1 +"," + 1 + ")"),
			// Create sankey diagram object
			this.sankey = d3.sankey()
				.nodeWidth(this.nodeWidth)
				.nodePadding(this.nodePadding)
				.size([this.width, this.height])
			this.path = this.sankey.link();
			
			return this.loadJSON(this.treeSource, callback);
		},
		//
		//
		//
		// Functions for displaying data
		//
		//
		//
		showData : function(data, callback) {
			var that = this;
			// Load links
			this.allLinks = data.links['genetic'].concat(data.links['contact']);
			this.sankey.nodes(data.nodes)
				.links(this.allLinks)
				.layout(32)
						
			// Show genetic relationships via geneticLinks
			this.geneticLinks = this.svg.append("g").selectAll(".genlink")
				.data(data.links['genetic'])
			.enter().append("path")
				.attr("class", "link genlink")
				.attr("d", this.path)
				.style("stroke-width", function(d) { return Math.max(1, d.dy); })
				.sort(function(a,b) { return b.dy - a.dy; });
			
			// Show contact-based influence relationships via contactLinks
			this.contactLinks = this.svg.append("g").selectAll(".conlink")
				.data(data.links['contact'])
			.enter().append("path")
				.attr("class", "link conlink")
				.attr("d", this.path)
				.style("stroke-width", function(d) { return Math.max(1, d.dy); })
				.sort(function(a,b) { return b.dy - a.dy; });
			
			// Display languages as rectangular nodes			
			this.nodes = this.svg.append("g").selectAll(".node")
				.data(data.nodes)
			.enter().append("g")
				.attr("class", this.classString)
				.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
			.call(d3.behavior.drag()
				.origin(function(d) { return d; })
				.on("dragstart", function() { this.parentNode.appendChild(this); })
				.on("drag", dragmove));
				
			this.nodes.append("rect")
				.attr("height", function(d) { return d.dy; })
				.attr("width", this.sankey.nodeWidth());
				
			this.nodes.append("text")
				.attr("x", -6)
				.attr("y", function(d) { return d.dy / 2; })
				.attr("dy", ".35em")
				.attr("text-anchor", "end")
				.attr("transform", null)
				.text(function(d) { return d.data.fullname; })
			.filter(function(d) { return d.x < that.width / 2; })
				.attr("x", 6 + this.sankey.nodeWidth())
				.attr("text-anchor", "start");
				
			function dragmove(d) {
				d3.select(this)
					.attr("transform", "translate(" + d.x + "," + (d.y = Math.max(0, Math.min(that.height - d.dy, d3.event.y))) + ")");
				that.sankey.relayout();
				that.contactLinks.attr("d", that.path);
				that.geneticLinks.attr("d", that.path);
			}
			
			if(callback) return callback();
			return this;
		},
		//
		//
		//
		// Data Loading
		//
		//
		//
		loadJSON : function(uri, callback) {
			var that = this;
			return d3.json(uri, function(json) { return that.showData(json, callback); } );
		},
		//
		//
		//
		// Helper functions
		//
		//
		//
		classString : function(d) {
			// Create a class string for the node based on status (alive, dead, reconstructed)
			var classes = "node ";
			if(!d.data.attested) {
				classes += "theoretical";
			}else if(d.data.living) {
				classes += "alive";
			}else{
				classes += "dead";
			}
			return classes;
		}
	};
};


jn.IESankey = function() {
	var chart = jn.IESankeyChart();
	chart.init();
	return chart;
};
									