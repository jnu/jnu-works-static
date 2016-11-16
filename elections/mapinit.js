var jn = jn || {};


(function() {
jn.ElectionMap = function() {
		$('#loadbuttons').accordion({heightStyle: "fill"});
        var R = Raphael("map", 500, 450),
            attr = {
            "fill": "#d3d3d3",
            "stroke": "#fff",
            "stroke-opacity": "1",
            "stroke-linejoin": "round",
            "stroke-miterlimit": "0",
            "stroke-width": "0.75",
            "stroke-dasharray": "none"
            },
            usRaphael = {};
            //label = R.popup(0, 0, "").hide(); // getting a weird error with this
		
        //Draw Map and store Raphael paths
        for (var state in jn.usMap) {
            usRaphael[state] = R.path(jn.usMap[state]).scale(0.5, 0.5, 0, 0).attr(attr);
			$(usRaphael[state][0]).qtip({
				content: "",
				show: {
					delay: 0
				},
				position: {
					target: 'mouse',
					adjust: {
						mouse: true,
						y: +20
					}
				},
				style: {
					name: 'light',
					"font-size": '0.5em'
				}
			});
        } 
	
        
        //Install events on buttons
        $('#loadbuttons h3').each(function(i, me) {
            $(me).click(function(e) {
				 // disable this button, enable others
				 //$(me).prop('disabled', true).addClass('ui-state-disabled');
				 //$(me).parent().siblings().children('button').prop('disabled', false).removeClass('ui-state-disabled');
					 
                // fetch data via ajax and load into map
				var file = $(me).attr('location');
				$.getJSON(file, function(data) {
					// Initialize vote counts
					var dem = 0
						gop = 0,
						neither = 0,
						dem_lbl = data['meta']['left'],
						gop_lbl = data['meta']['right'];
						
					for (var state in usRaphael) {
						// Loop through states and tally votes, set colors, fill out tooltips
						(function (state, name) {
							var val = data[name.toUpperCase()]['vote'],
								lbl = data[name.toUpperCase()]['label'],
								tipstyle = "light";
								
							// store score for diplaying in label later
							state.data('score', val);
							state.data('label', lbl);
							
							// Determine colors, count votes
							if(val>1) {
								// This is an "ambivalence" value. Arbitrary.
								color = "#ccc";
								tipstyle = "light";
								state.data('label', "Ambivalent");
								neither += state.data('votes');
							}else if(val>0) {
								color = "#22f";
								tipstyle = "blue";
								dem += state.data('votes');
							}else if(val==0) {
								color = "#2E0854";
								tipstyle = "dark";
								add = Math.ceil(state.data('votes')/2);
								dem += add;
								gop += state.data('votes')-add;
							}else{
								color = "#f22";
								tipstyle = "red";
								gop += state.data('votes');
							}
							
							// Set tooltip
							ltext = "<div id='labelhead'>"+state.data('name')+"</div>";
							ltext+= "<span id='labelsection'>Electoral Votes:</span> " + state.data('votes') + "<br />";
							ltext+= "<span id='labelsection'>Vote:</span> " + state.data('label');
							$(state[0]).qtip('destroy');
							$(state[0]).qtip({
								content: ltext,
								position: {
									target: 'mouse',
									adjust: {
										mouse: true,
										y: +20
									}
								},
								style: {
									name: tipstyle,
									"font-size": '0.5em'
								}
							});
							
							state[0].style.cursor = "pointer";
							state.animate({fill: color}, 300);
							state.toFront();
							R.safari();
						})(usRaphael[state], state);
					} // end looping through states
					
					// display vote counts
					var total = gop + dem + neither;
					var gop_pct = 100 * gop / total,
						dem_pct = 100 * dem / total;
					$('#votes #colorline>.gop').width(gop_pct+"%");
					$('#votes #colorline>.dem').width(dem_pct+"%");
					$('#votes #numbers>.gop').html(gop);
					$('#votes #labels>.gop').html(gop_lbl);
					$('#votes #numbers>.dem').html(dem);
					$('#votes #labels>.dem').html(dem_lbl);
					
					e.preventDefault();
				});
            });
        });

		
		// Load information about states
		$.getJSON("/sandbox/elections/states.txt", function(data) {
			for(var state in usRaphael) {
				usRaphael[state].data('name', data[state.toUpperCase()]['name']);
				usRaphael[state].data('votes', data[state.toUpperCase()]['votes']);
			}
			
			//Simulate first button click so something is shown in the map
			$('#loadbuttons>h3:first-child').trigger('click');
		});
		};
})();