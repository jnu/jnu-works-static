var jn = jn || {};
jn.force = jn.force || {};


jn.force._sanitizeName = function(name) {
	return name.replace(/\s/g, '_').replace(/[^\w\d]/g, '');
}
jn.force.nodes_changed = true;
jn.force.scale_factor = 1;
jn.force.scale_target = 100;


jn.force.createForceGraph = function(json) {
	var width = 528,
		height = 500;
		
	var color = d3.scale.category20();
	
	var force = d3.layout.force()
				.charge(-120)
				.linkDistance(function(link, index) {
					var d = link.value;
					if( $('#scalecheck').prop('checked') ) {
						d = d * jn.force.scale_factor;
					}
					return d;	
				})
				.size([width, height]);
				
	var svg = d3.select("#chart").append("svg")
							     .attr("width", width)
								 .attr("height", height);

	force.nodes(json.nodes)
		 .links(json.links)
		 .start();

	var link = svg.selectAll("line.link")
				  .data(json.links)
				  .enter().append("line")
				  .attr("class", "link");
				  //.style("stroke-width", function(d) { return Math.sqrt(d.value); });

	var node = svg.selectAll("circle.node")
				  .data(json.nodes)
				  .enter().append("circle")
				   		  .attr("class", "node")
						  .attr("r", 5)
						  .style("fill", function(d) { return color(d.group); })
						  .call(force.drag);
 
	node.append("title")
		.text(function(d) { return d.name; });

	force.on("tick", function() {
		link.attr("x1", function(d) { return d.source.x; })
			.attr("y1", function(d) { return d.source.y; })
			.attr("x2", function(d) { return d.target.x; })
			.attr("y2", function(d) { return d.target.y; });

		node.attr("cx", function(d) { return d.x; })
			.attr("cy", function(d) { return d.y; });
	});
}







jn.force.init_network_maker = function(){
	
	// Initialize tab slider
	$('#panels').tabs();
	// Disable all but first tab
	$('#panels').tabs('disable');
	$('#panels').tabs('enable', 0);
	// buttons
	$('.nextbutton .btn').button({disabled: true});
	$('#scalecheck').prop("checked", true);
	
	
	$('.labeltext').keyup(function(e) {
		jn.force.nodes_changed = true;
		if($('#labellist>div:last-child input').val()) {
			$('#labellist>div:last-child').clone(true).appendTo('#labellist');
			$('#labellist>div:last-child input').val('');
		}else{
			var n = $('#labellist input').size() - 1;
			if(n>=1 && !$('#labellist>div:nth-child('+n+') input').val()) {
				$('#labellist>div:last-child').remove();
			}
		}
		// Disable Edge Weights tab if there aren't 2 or more nodes
		var cnt = 0;
		$('#labellist input').each(function(i, me) {
			if( $(me).val() ) {
				cnt+=1;
				if( cnt>=2 ) {
					$('#panels').tabs('enable', 1);
					$('#nodelabels_next').button({disabled: false});
					return false;
				}
			}
		});
		if(cnt<2) {
			$('#panels').tabs('disable', 1);
			$('#nodelabels_next').button({disabled: true});
		}
});
	$('.labeltext').keydown = $('.labeltext').keyup;
	
	
	// Take node labels and create edge weights form
	$('#panels ul li[aria-controls=edgeweights] a').click(function(e) {
		if(jn.force.nodes_changed) {
			var labels = [];
			$('#labellist input').each(function(i, me) {
				if($(me).val()!='') {
					labels.push($(me).val());
				}
			});
			$('#edgeslist').empty();
			for(var i in labels) {
				var label_i = jn.force._sanitizeName(labels[i]);
				for(var j in labels) {
					var label_j = jn.force._sanitizeName(labels[j]);
					if(i<j) {
						var id = "edge-"+label_i+"-to-"+label_j,
							hum_lbl = labels[i] + " to " + labels[j],
							row = "<div class='edgerow' id='"+id+"'><div class='edgeth'>"+hum_lbl+"</div><div class='edgetd'><input id='"+id+"' from='"+i+"' fromtext='"+label_i+"' to='"+j+"' totext='"+label_j+"' class='edgeweighttxt' /></div></div>";
						$('#edgeslist').append(row);
					}
				}
			} // end loop
			// Add key event handlers to enable JSON out when there is a value in the edges weights
			$('.edgerow .edgetd input').keyup(function(e) {
				var cnt = 0;
				$('.edgerow .edgetd input').each(function(i, me) {
					if($(me).val()) {
						cnt += 1;
						// Enable JSON tab
						$('#panels').tabs('enable', 2);
						$('#edgeweights_next').button({disabled: false});
						return false;
					}

				});
				if(cnt<1) {
					$('#panels').tabs('disable', 2);
					$('#edgeweights_next').button({disabled: true});
				}
			});
		// Set variable so that form isn't redrawn (and data lost)
		// unless the nodes are changed
		jn.force.nodes_changed = false;
		}
	});
	
	
	// Construct JSON output from edge labels / node names
	$('#panels ul li[aria-controls=jsonoutput] a').click(function(e) {
		var labels = [],
			edges = [];
		$('#labellist input').each(function(i, me) {
			if($(me).val()) {
				labels.push({"name": $(me).val(), "group": 0});
			}
		});
		var sum = 0,
			len = 0;
		$('#edgeslist input').each(function(i, me) {
			if($(me).val()) {
				if( $('#scalecheck').prop('checked') ) {
					// if scaling is desired, compute scale factor from average
					sum += parseInt($(me).val());	
					len += 1;
				}
				edges.push({"source": parseInt($(me).attr('from')), "target": parseInt($(me).attr('to')), "value": parseInt($(me).val())});
			}
		});
		jn.force.scale_factor = (len>0)? jn.force.scale_target/(sum/len) : 1;
		var json = {"nodes": labels, "links": edges};
		$('#jsonout').html(JSON.stringify(json));
		$('#chart').empty();
		jn.force.createForceGraph(json);
	});
	
	
	// Pass along "Next" button to tab click
	$('#nodelabels_next').click(function(e) {
		$('#panels ul li[aria-controls=edgeweights] a').trigger('click');
	});
	$('#edgeweights_next').click(function(e) {
		$('#panels ul li[aria-controls=jsonoutput] a').trigger('click');
	});
	
}




jn.ForceDemo = function() {
	html = '<div id=panels><ul><li><a href="#nodelabels">Node Labels</a></li><li><a href="#edgeweights">Edge Weights</a></li><li><a href="#jsonoutput">Output - JSON</a></li></ul><div id=nodelabels><p class=content><div id=labellabel>Enter labels for nodes:</div><div id=labellist><div class=labeltxtwrap><input class=labeltext></div></div><div class=nextbutton><a id=nodelabels_next class="btn next">Next</a></div></p></div><div id=edgeweights><p class=content><div id=edgeslabellabel>Enter edge weights (leave blank if there is no edge)</div><div id=edgeslist></div><div id=scalechecks><input type=checkbox id=scalecheck><label for=scalecheck>Scale Edges</label></div><div class=nextbutton><a id=edgeweights_next class="btn next">Next</a></div></p></div><div id=jsonoutput><p class=content><div id=jsonlabel>JSON</div><div id=jsonout></div><div id=chart></div></p></div></div>';
	$('#jn-widgetcontainer').html(html);
	return jn.force.init_network_maker()
}