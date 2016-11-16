;var jn = jn || {};

(function(jn, $, d3) {

    // Define default attributes
    var defaults = {
        type: 'chord',
        width: 1120,
        height: 720,
        padding: 20,
        textHeight: 15,
        spacing: .01,
        headerSize: 30,
        formatPercent: d3.format(".1%"),
        formatNumber: d3.format(","),
        formatCurrency: function(x) {
            return "£"+d3.format(",.2f")(x/1000000)+" M"
        },
        target: 'body',
        colors: d3.scale.category20(),
        data: 'transfers-noloan.csv',
        meta: 'meta.json',
        table: null
    }


    // Create visualization
    function _makeChordVis(attrs, my) {

        var // Copy defaults to local vars
            width = attrs.width,
            height = attrs.height,
            diameter = Math.min(width, height),
            textHeight = attrs.textHeight,
            padding = attrs.padding,
            outerRadius = diameter / 2 - padding,
            innerRadius = outerRadius - textHeight,
            formatPercent = attrs.formatPercent,
            defaultFormat = attrs.formatNumber,
            formatCurrency = attrs.formatCurrency,
            formatNumber = formatCurrency,
            target = attrs.target,
            colors = attrs.colors,
            // --
            // Main chart set up
            arc = d3.svg.arc()
                .startAngle(function(d) { return d.startAngle })
                .endAngle(function(d) { return d.endAngle })
                .innerRadius(innerRadius)
                .outerRadius(outerRadius),
            //
            layout,
            lastLayout,
            //
            path = d3.svg.chord()
                .radius(innerRadius),
            //
            svg = d3.select(target).append("svg")
                .attr("width", width)
                .attr("height", height),
            //
            info = svg.append("g")
                .attr('id', 'info')
                .attr('transform', 'translate('+ diameter +','+ padding +')'),
            //
            osvg = svg,
            curtain,
            $loading,
            //
            hTextSize = attrs.headerSize,
            iTextSize = attrs.headerSize>>1,
            //
            labelTitle = info.append("text")
                .attr("x", 0)
                .attr("dy", padding)
                .style('font-size', hTextSize),
            //
            teamText = info.append("text")
                .attr("x", 0)
                .attr("dy", padding+hTextSize)
                .style("font-size", iTextSize),
            //
            infoTextWith = info.append("text")
                .attr("x", 0)
                .attr("dy", padding+hTextSize+iTextSize)
                .style("font-size", iTextSize),
            //
            infoTextOne = info.append("text")
                .attr("x", 0)
                .attr("dy", padding+hTextSize+iTextSize*2)
                .style("font-size", iTextSize),
            //
            infoTextTwo = info.append("text")
                .attr("x", 0)
                .attr("dy", padding+hTextSize+iTextSize*3)
                .style("font-size", iTextSize),
            // vars to be initialized later
            chord,
            group,
            groupPath,
            groupText,
            //
            matrix,
            trCounts,
            teamKeys,
            teamCounts,
            allCounts,
            moneyVar=true,
            //
            selectedTeam;

        // make attributes
        my.data = my.data || {};
        my.attrs = $.extend({},attrs, {
            diameter: diameter
        });


        // Add circle to the svg for laying out arcs
        svg = svg.append("g")
                .attr("id", "circle")
                .attr("transform",
                    "translate(" + diameter / 2 + "," + height / 2 + ")");

        svg.append("circle")
              .attr("r", outerRadius);

        // Make a curtain that will be unveiled when data is finished loading
        curtain = osvg.append("g")
                .attr("id", "curtain")
                .append("rect")
                    .style("fill", '#fff')
                    .attr('x', 0)
                    .attr('y', 0)
                    .attr('width', diameter)
                    .attr('height', diameter),
            //
        $loading = $('#loader').css({
            'left' : diameter/2,
            'top': diameter/2,
            'z-index': 1
        });


        // Fetch data
        d3.csv(attrs.data, function(transfers) {
            d3.json(attrs.meta, function(meta) {
                transfers = transfers.map(function(e) {
                    // CSV Team uses IDs to save space. Unpack here.
                    e['Team'] = meta.teams[e['Team']];
                    return e;
                });

                // Keep track of data
                my.data.transfers = transfers;
                my.data.meta = meta;

                // Remove loading stuff
                fadeLoad('out', 400);

                // Layout screen
                setup(moneyVar);

                my.draw = function (t) {
                    setup(t, true);
                }
            });
        });


        function fadeLoad(dir, dur, callback) {
            callback = callback || function(){};
            var val = dir=="in"? 1 : 0;

            if(val){
                curtain.style('display', '');
                $loading.fadeIn(dur);
            }else{
                $loading.fadeOut(dur);
            }
            curtain.transition()
                .duration(dur)
                .style('opacity', val)
                .each("end", function(){
                    if(!val) {
                        curtain.style('display', 'none');
                    }
                    callback();
                });
        }




        // Layout stuff
        function setup(money, relayout) {
            // First figure out matrix from data
            var _mk = _createMatrix(my.data.transfers, my, money!=undefined),
                meta = my.data.meta,
                abbrs = meta.meta;

            moneyVar = money;

            // Reset number formatter
            formatNumber = money? formatCurrency : defaultFormat;

            matrix = _mk[0];
            teamKeys = _mk[1];
            teamCounts = _mk[2];
            trCounts = _mk[3];
            allCounts = 0;

            // Sum up team counts
            for(var i=0; i<teamKeys.length; i++) {
                allCounts += teamCounts[teamKeys[i]];
            }

            // Create layout
            layout = d3.layout.chord()
                .padding(attrs.spacing)
                .sortGroups(d3.descending)
                .sortChords(d3.ascending);

            // Compute the chord layout.
            layout.matrix(matrix);

            if(relayout) {
                updateImage(abbrs);
                return;
            }

            lastLayout = layout;
            

            // Make labels

            // default text values
            setLabel();
            setGenText();
            setTextWith();
            setInfoText('out');
            setInfoText('in');

            // Add a group per team
            group = svg.selectAll(".group")
                .data(layout.groups)
                .enter()
                    .append("g")
                    .attr("class", "group")
                    .on("mouseover", mouseoverGroup);

            groupPath = group.append("svg:path")
                .attr("id", function(d, i) { return "gr"+i; })
                .attr("class", "arc")
                .attr("d", arc)
                .style("fill", function(d, i) {
                    return (abbrs[teamKeys[i]]||{}).color||"#555555";
                });

            makeTextLabels(abbrs);


            chord = svg.selectAll(".chord")
                    .data(layout.chords);

            chord.enter().append("path")
                    .attr("class", "chord")
                    .on('mouseover', mouseoverChord)
                    .style("fill", function(d) {
                        var count1, count2, i,
                            sid = d.source.index,
                            tid = d.target.index;

                        count1 = trCounts[teamKeys[sid]][teamKeys[tid]] || 0;

                        if(trCounts[teamKeys[tid]]==undefined) {
                            count2 = 0;
                        }else{
                            count2 = trCounts[teamKeys[tid]][teamKeys[sid]]||0;
                        }

                        i = count2<count1? d.source.index : d.target.index;
                    
                        return (abbrs[teamKeys[i]]||{}).color||"#555555";
                    })
                    .attr("d", path);

        } // end of setup()


        function updateImage(abbrs) {
            // Function for changing focus of chords
            removeTextLabels(400, function() {
                // Move chords
                svg.selectAll('.arc')
                    .data(layout.groups)
                    .transition()
                    .duration(1000)
                    .attrTween("d", arcTween(lastLayout));

                var last = svg.selectAll('.chord')[0].length - 1;

                svg.selectAll('.chord')
                    .data(layout.chords)
                    .transition()
                    .duration(1000)
                    .attrTween('d', chordTween(lastLayout))
                    .each('end', function(d, i){
                        if(i==last) {
                            makeTextLabels(abbrs);
                        }
                    });

                // Set lastLayout for tweening
                lastLayout = layout;
            });
        }  



        // Auxilliary functions -- event handlers, etc

        function removeTextLabels(dur, callback) {
            var last = groupText[0].length-1;
            if(dur===undefined) {
                dur = 500;
            }

            groupText.transition()
                .duration(dur)
                .style('opacity', 0)
                .each('end', function(d,i) {
                    if(i==last) {
                        if(callback!=undefined) {
                            callback();
                        }
                    }
                })
                .remove();
        }

        function makeTextLabels(abbrs, dur, callback) {
            groupText = group.append("text")
                .attr("x", 2)
                .attr("dy", 11);

            if(dur===undefined) {
                dur = 500;
            }

            groupText.append("textPath")
                .attr("xlink:href", function(d, i){ return "#gr"+i;})
                .attr('class', 'teamLabel')
                .text(function(d, i) {
                    return (abbrs[teamKeys[i]]||{}).abbr||"";
                })
                .style('opacity', 0);

            filterLongLabels();

            var last = svg.selectAll('.teamLabel')[0].length - 1;

            svg.selectAll('.teamLabel')
                .transition()
                .duration(dur)
                .style('opacity', 1)
                .each('end', function(d, i) {
                    if(i==last) {
                        if(callback!==undefined) {
                            callback();
                        }
                    }
                });
        }

        function filterLongLabels() {
            groupText.filter(function(d, i) {
                var s = groupPath[0][i].getTotalLength() / 2 - 16;
                return s < this.getComputedTextLength();
            }).remove();
        }

        function mouseoverGroup(d, i) {
            chord.classed("fade", function(p) {
                return p.source.index != i
                    && p.target.index != i;
            });
            
            setGenText(d.value, teamCounts[teamKeys[i]], allCounts);
            setLabel(teamKeys[i]);
            relightChords();
            selectedTeam = i;

            setTextWith();
            setInfoText('out');
            setInfoText('in');
        }

        function mouseoverChord(d, i) {
            chord.classed("unlit", function(p) {
                return p != d;
            });

            var oid, count1, count2, firstval, secondval, text1, text2,
                sid = d.source.index,
                tid = d.target.index;

            count1 = trCounts[teamKeys[sid]][teamKeys[tid]] || 0;

            if(trCounts[teamKeys[tid]]==undefined){
                count2 = 0;
            }else{
                count2 = trCounts[teamKeys[tid]][teamKeys[sid]] || 0;
            }

            firstval = d.source.value;
            secondval = d.target.value;

            if(d.source.index==selectedTeam) {
                oid = d.target.index;
            }else{
                oid = d.source.index;
                // switch incoming / outgoing figures
                var a = count1,
                    b = firstval;
                count1 = count2;
                count2 = a;
                firstval = secondval;
                secondval = b;
            }

            setTextWith(teamKeys[oid]);
            setInfoText('out', count1, firstval);
            setInfoText('in', count2, secondval);
        }

        function setLabel(name) {
            labelTitle.text(name||"---");
        }

        function setGenText(pct, count, total) {
            var text = "";

            if(moneyVar) {
                text += "Made "
                    + (count? formatNumber(count) : "-")
                    + " in trade ("
                    + (pct? formatPercent(pct):"-%") +" "
                    + "of "
                    + (total? formatNumber(total) : "-") +" total pot)";
            }else{
                text += "Originated "
                    + (count? formatNumber(count) : "-")
                    + " transfers ("
                    + (pct? formatPercent(pct):"-%") +" "
                    + "of "
                    + (total? formatNumber(total) : "-") +" total transfers)";
            }

            teamText.text(text);
        }

        function setTextWith(team) {
            infoTextWith.text("Trading with "+ (team||"--"));
        }

        function setInfoText(dir, num, pct) {
            var text = "", ger="";
            if(moneyVar) {
                ger = dir=="in"? "spent" : "made";
                text = "Money";
            }else{
                ger = dir=="in"? "coming in" : "going out";
                text = "Talent";
            }
            text += " "+ ger + ": "
                + (num!=undefined? formatNumber(num) : "-")
                + " ("
                + (pct!=undefined? formatPercent(pct) : "-%")
                + " of total)";
            if(dir=='out'){
                infoTextOne.text(text);
            }else{
                infoTextTwo.text(text);
            }
        }

        function relightChords() {
            chord.classed("unlit", function() { return false; });
        }


        function arcTween(chord) {
            return function(d,i) {
                var i = d3.interpolate(chord.groups()[i], d);

                return function(t) {
                    return arc(i(t));
                }
            }
        }

        var chordl = d3.svg.chord().radius(innerRadius);

        function chordTween(chord) {
            return function(d,i) {
                var i = d3.interpolate(chord.chords()[i], d);

                return function(t) {
                    return chordl(i(t));
                }
            }
        }



        // end of aux functions



    } // End of _makeChordVis








    function _createMatrix(csv, my, money) {
        // Create directed frequency/adjacency matrix from a csv
        var key = money?"money":"noMoney";
        my.data.mtx = my.data.mtx || {};

        if(my.data.mtx[key]) {
            // memoized
            return my.data.mtx[key];
        }

        var mtxo = {},
            records = {},
            matrix = [],
            allTeams = {},
            eplTeams = {
                'End of career' : true,
                //'Other': true
            };

        for(var i=0; i<csv.length; i++) {
            // Find all EPL teams
            eplTeams[csv[i]['Team']] = true;
        }

        for(var i=0; i<csv.length; i++) {
            // Tally 
            var entry = csv[i],
                direction = entry['Direction'],
                teamOne = entry['Team'],
                otherTeam = entry['Other Team'],
                //teamTwo = otherTeam,
                teamTwo = eplTeams[otherTeam]==undefined? "Other" : otherTeam,
                fromTeam = direction=='in'? teamTwo : teamOne,
                toTeam = direction=='in'? teamOne : teamTwo,
                //
                tally = money? parseInt(entry['Price'])||0 : 1,
                // Ignore duplicate records with uid for hash table
                uid = (teamOne<teamTwo? teamOne+teamTwo:teamTwo+teamOne)
                    + entry['Last Name'] + entry['First Name']
                    + entry['Loan'] + entry['Price'];

            // Check hash for dupes
            if(records[uid]!==undefined) {
                continue
            }
            records[uid] = true;




            if(allTeams[toTeam]==undefined) {
                // Using this obj as a hash table. Only keys will matter.
                allTeams[toTeam] = true;
            }
            if(allTeams[fromTeam]==undefined) {
                // Store from_teams in hash as well
                allTeams[fromTeam] = true;
            }

            // Tally
            if(mtxo[fromTeam]==undefined) {
                mtxo[fromTeam] = {};
            }

            if(mtxo[fromTeam][toTeam]==undefined) {
                mtxo[fromTeam][toTeam] = 0;
            }

            mtxo[fromTeam][toTeam] += tally;
        }

        // Comprehend mtxo as a square matrix using keys from all_teams
        //var teamKeys = Object.keys(allTeams);
        var teamKeys = Object.keys(eplTeams),
            teamCounts = {};

        for(var i=0; i<teamKeys.length; i++) {
            var firstKey = teamKeys[i],
                row = [];

            teamCounts[firstKey] = 0;

            for(var j=0; j<teamKeys.length; j++) {
                var secondKey = teamKeys[j],
                    val = 0;

                if(mtxo[firstKey]!=undefined) {
                    // Get transfers to teams
                    if(mtxo[firstKey][secondKey]!=undefined) {
                        val = mtxo[firstKey][secondKey];
                    }
                }

                row.push(val);
                teamCounts[firstKey] += val;
            }

            matrix.push(row);
        }

        // Memoize for later
        _rval = [_normalize(matrix), teamKeys, teamCounts, mtxo];
        my.data.mtx[key] = _rval;

        return _rval;
    }


    function _normalize(matrix) {
        var sum = 0;
        for (var i=0; i<matrix.length; i++) {
            for (var j=0; j<matrix[i].length; j++) {
                sum += matrix[i][j];
            }
        }

        for (var i=0; i<matrix.length; i++) {
            for (var j=0; j<matrix[i].length; j++) {
                matrix[i][j] /= sum;
            }
        }

        return matrix;
    }



    // Dispatch visualization
    function _makeVis(attrs, ns) {
        if(attrs.type=='chord') {
            _makeChordVis(attrs, ns);
        }else{
            var msg = "Visualization type "
            + attrs.type
            + "unsupported at this time.";
            console.error(msg);
        }
    }



    // Install in namespace
    jn.vis = jn.vis || {};
    jn.vis.plt = {};

    jn.vis.plt.start = function(attrs) {
        _makeVis($.extend({}, defaults, attrs), jn.vis.plt);
    }

})(jn, jQuery, d3);


