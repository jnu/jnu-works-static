/**
 * attlogview.js
 *
 * Copyright (c) 2013 Joseph Nudell.
 */


// my namespace
var jn = jn || {};





jn.ATTLogView = function(params) {
    // Create a new object container fo rthe log viewers
    if(params===undefined) params = {};

    // DEFAULTS: store customizable params. OBJ: store readonly params / fns
    var defaults = {
        //
        //
        // These parameters are all customizable via `params` object.
        //
        //
        //
        dataSource  : "",
        //
        // Format strings.
        //   Details: https://github.com/mbostock/d3/wiki/Time-Formatting
        dateFormat  : "%x",
        timeFormat  : "%I:%M%p",
        dayFormat   : "%a",
        //
        // DOM Targets
        chartTarget : ".chart-target",
        dataTableContainer : "#dataTable",
        counterContainer : "#counter",
        //
        ioFilterContainer : "#io",
        currentTextsLbl : "#current-texts",
        textRateTarget : "#text-rate",
        //
        // View configurations
        views : {
            dataTable : {
                // Setup for dataTable
                size: 10,
                order: d3.ascending,
                sortBy: function (d) { return d.fdate; },
                columns : [
                    function(d) {
                        return d3.time.format("%x")(d.fdate);
                    },
                    function(d) {
                        return d3.time.format("%-I:%M %p")(d.fdate);
                    },
                    function(d) { return d['In/Out']; },
                    function(d) { return d['To/From']; },
                    function(d) {
                        return d.city? d.city+", "+d.state : d.state;
                    },
                ],
            },
            //
            general : {
                // This base configuration will be applied to every chart
                transitionDuration : 500,
            },
            //
            month : {
                margins : {top: 10, right: 50, bottom: 30, left: 40},
                elasticY : true,
                //centerBar : true,
                title : function(d) { return "Value: "+ d.value; },
                renderTitle : true,
            },
            //
            location : {
                colors : [
                    "#ccc", "#E2F2FF","#C4E4FF",
                    "#9ED2FF","#81C5FF","#6BBAFF",
                    "#51AEFF","#36A2FF","#1E96FF",
                    "#0089FF","#0061B5"
                ],
                title : function(d) {
                    var n = d.value || 0;
                    return d.key+ ": "+ n +" texts";
                },
            },
            //
            day : {
                radius : 90,
                innerRadius : 40,
            },
            //
            daytime : {
                margins : {top:10, right:50, bottom:30, left:40},
            }
        },
        //
    },
    //
    //
    //
    obj = {
        //
        // These parameters are not directly customizable on init.
        // 
        // Containers:
        data   : [],
        cf     : null,
        dim    : {},
        group  : {},
        //
        charts : {},
        counter : null,
        dataTable : null,
        //
        areaCodesURL : "/static/areacodes.json",
        areaCodes : {},
        statesURL : "/static/us-states.json",
        statesJson : {},
        //
        modalSelector : "#loadMoad",
        //
        //
        init : function() {
            // Things to do on init:
            var that = this;

            // Show Load Screen
            $(this.modalSelector).modal({keyboard: false});

            // Load data.
            this.loadData(that.dataSource, function() {
                // Data here is loaded, processed, and crossfiltered
                // Next: create dimensions and groups

                var cf = that.cf;

                // "ALL" group
                that.group.all = cf.groupAll();
                
                // Some Temporal dimensions
                that.dim.month = cf.dimension(function(d) {
                    return d3.time.month(d.fdate);
                });
                that.group.month = that.dim.month.group().reduceCount();
                
                that.dim.date = cf.dimension(function(d) {
                    return d.fdate;
                });
                that.group.date = that.dim.date.group().reduceCount();

                that.dim.day = cf.dimension(function(d) {
                    return d3.time.format("%A")(d.fdate);
                });
                that.group.day = that.dim.day.group().reduceCount();

                that.dim.daytime = cf.dimension(function(d) {
                    return ((d.fdate.getHours()*60)+d.fdate.getMinutes()) / 60;
                });
                that.group.daytime = that.dim.daytime.group().reduceCount();


                // Spatial dimensions
                that.dim.location = cf.dimension(function(d) {
                    return d.state;
                });
                that.group.location = that.dim.location.group().reduceCount();

                // Other dimensions
                that.dim.direction = cf.dimension(function(d) {
                    return d['In/Out'];
                });
                that.group.direction = that.dim.direction.group().reduceCount();

                // Create Radio Filters
                that.createIOFilters();

                // Create data table
                that.createDataTable();

                // Create N (count) widget
                that.createCounter();

                // Create statastics display -- must come after counter
                that.createStatDisplay();

                // Create charts
                that.createCharts();

                // Lastly, install a convenient closure in the global scope
                // for applying filters anywhere
                window.filter = function _filterer(id, val) {
                    that.charts[id].filter(val);
                    dc.redrawAll();
                }
            });
        },
        //
        //
        //
        createStatDisplay : function() {
            // Create a simple stats display to answer basic questions
            // such as "how many texts are sent per day?"
            var that = this;

            // Get total number of texts
            var allTexts = this.group.all.value();

            function _calculateSelectionStats() {
                // Closure for calculating and displaying statistics
                // based on current selection
                var val = "";
                try{
                    var lbl = $(that.currentTextsLbl).text(),
                        n = parseInt(lbl.replace(/,/g, ''), 10);

                    var firstDate = that.dim.date.bottom(1)[0].fdate,
                        lastDate = that.dim.date.top(1)[0].fdate,
                        delta = daysBetween(firstDate, lastDate),
                        rate = n / delta;
                    
                    val = rate.toFixed(2);
                }catch(e){
                    val = "--";
                }

                // Set the text of the rate DOM target
                $(that.textRateTarget).text(val);
            }

            // Hook the stats closure to run after the dataCounter is updated.
            that.counter.on('postRender', _calculateSelectionStats);
            that.counter.on('postRedraw', _calculateSelectionStats);
        },
        //
        //
        //
        createIOFilters : function() {
            // Add click handlers for radio buttons. Set them up as filters.
            // These filters filter the direction of text ("in" or "out")
            var that = this;
            $(this.ioFilterContainer+">button").click(function() {
                var val = $(this).attr('data-filter');
                if(val){
                    that.dim.direction.filter(val);
                }else{
                    that.dim.direction.filterAll();
                }
                dc.redrawAll();
            })
        },
        //
        //
        //
        createCounter : function() {
            // The text that says how many items from the dataset are
            // currently selected.
            this.counter = dc.dataCount(this.counterContainer)
                .dimension(this.cf)
                .group(this.group.all);
        },
        //
        //
        //
        createDataTable : function() {
            // Table that presents raw data for the user to examine
            var that = this;

            this.dataTable = dc.dataTable(this.dataTableContainer)
                .dimension(that.dim.date)
                .group(function(d) {
                    return "Sample data from <span class='text-info'>"
                            + d3.time.format("%B, %Y")(d.fdate)
                            + "</span>";
                });

            Object.keys(this.views.dataTable).forEach(function(key) {
                that.dataTable[key](that.views.dataTable[key]);
            });
        },
        //
        //
        //
        createCharts : function() {
            // Look through DOM element specified by this.chartContainer
            // and make a chart out of any DIV that's a child in this
            // container. They should all have meta-data that connects them
            // to a dimension and chart type.
            var that = this;

            $(this.chartTarget).each(function() {
                // Load data pertaining to chart from DOM
                var id = $(this).attr('id'),
                    type = $(this).attr('data-type'),
                    dimension = $(this).attr('data-dimension'),
                    dim = that.dim[dimension],
                    group = $(this).attr('data-group'),
                    spec = {};

                if(typeof dc[type]!=='function') {
                    // Make sure that `date-type` attribute points to a valid
                    // chart type in dc.js.
                    throw "Illegal chart type ("+type+", "+typeof dc[type]+")";
                    return;
                }

                switch(dimension) {
                    // Set special content-specific / autocalculable params
                    case 'month':
                        var firstDate= dim.bottom(1)[0].fdate,
                            lastDate = dim.top(1)[0].fdate;

                        firstDate = firstDate.setMonth(firstDate.getMonth()-2);
                        lastDate = lastDate.setMonth(lastDate.getMonth()+2);

                        spec.x = d3.time.scale()
                                   .domain([new Date(firstDate),
                                            new Date(lastDate)]);
                        spec.xUnits = d3.time.months;
                        spec.round = d3.time.month.round;
                        break;

                    case 'location':
                        spec.overlayGeoJson = {
                            args : [
                                that.statesJson.features,
                                'state',
                                function(d) { return d.properties.name; }
                            ]
                        };

                        var w = that.views['location'].width || 200,
                            h = that.views['location'].height || 200;
                        spec.projection = d3.geo.albersUsa()
                                            .scale(w)
                                            .translate([w/2, h/2]);
                        break;

                    case 'daytime':
                        spec.x = d3.scale.linear().domain([0, 24]);
                        break;

                    default:
                        break;
                }

                function _apply(arr) {
                    // Apply custom configurations to chart
                    for(var key in arr) {
                        var fn = that.charts[id][key],
                            p = arr[key];
                        if(typeof p=='object' && p.args!==undefined) {
                            fn.apply(null, p.args);
                        }else{
                            fn(p);
                        }
                    }
                }


                // CREATE CHART
                that.charts[id] = dc[type]('#'+id)
                    .dimension(dim);

                // Apply special & Custom configuration to chart
                _apply(spec);

                // Set group if this was given as DOM attribute
                if(group) that.charts[id].group(that.group[group]);

                // Apply general default configuration to view
                _apply(that.views.general);

                // Apply user-specified configuration
                if(that.views[dimension]) _apply(that.views[dimension]);

                // Configure reset button if one is desired (if a.reset exists)
                var reset = $(this).find('a.reset');
                if(reset.length) {
                    reset.click(function() {
                        // Reset button executes closure to clear current
                        // chart and redraw (everything)
                        that.charts[id].filterAll();
                        dc.redrawAll();
                        return false;
                    });
                }

            }); // End of DOM chart targets traversal

            // Render charts
            dc.renderAll();
        },
        //
        //
        //
        redraw : function(group) {
            if(group===undefined) {
                dc.redrawAll(group);
            }else{
                dc.redrawAll();
            }
        },
        //
        //
        //
        loadData : function(url, callback) {
            // Load data (must be JSON) for specified URL
            var that = this;

            d3.json(url, function(data) {
                // Store data in object container
                d3.json(that.areaCodesURL, function(ac) {
                    // Save area codes
                    that.areaCodes = ac;
                    d3.json(that.statesURL, function(sj) {
                        // Finished loading remote data
                        $(that.modalSelector).modal('hide');

                        // Save states
                        that.statesJson = sj;

                        that.processData(data, function(data) {
                            // Process data
                            that.data = data;

                            // Feed data to crossfilter
                            that.cf = crossfilter(data);

                            // Finished here.
                            if(callback!==undefined) callback();
                        });
                    });
                });
            });
        },
        //
        //
        //
        processData : function(data, callback) {
            // Format the data by converting stringy dates and times to
            // Date objects via d3's helper functions.
            // This function does NOT modify any object containers
            // (specifically the data container), nor does it try to replace
            // the unformatted strings in the entry. Instead, it stores
            // the formatted date, time, and day in .fdate, .ftime, and .fday
            // attributes of the entry (note: these WILL be overwritten if they
            // are present, but they should not already be present.)
            var that = this;

            // Iterate through every item in data and use RegEx to determine
            // what needs to be formatted. The format strings used are
            // customizable parameters (see above).
            var dateFormat = d3.time.format(this.dateFormat),
                timeFormat = d3.time.format(this.timeFormat),
                dayFormat = d3.time.format(this.dayFormat),
                areaCodeMatcher = /To\/From/i,
                dateMatcher = /date/i,
                timeMatcher = /time/i,
                dayMatcher = /day/i;

            var newData = data.map(function(entry) {
                // Note: formatted entries do NOT replace old entries! They
                // are stored in the .fdate and .time attributes!
                for(var key in entry) {
                    // Iterate through object's keys and find a date or time
                    if(dateMatcher.test(key)) {
                        // Found Date
                        entry.fdate = dateFormat.parse(entry[key]);

                    }else if (timeMatcher.test(key)) {
                        // Found Time
                        entry.ftime = timeFormat.parse(entry[key]);

                    }else if (areaCodeMatcher.test(key)) {
                        // Found Area Code - Lookup location
                        var code = that.areaCodes[entry[key]];

                        if(code===undefined) {
                            code = {state: "Unknown", city: null};
                        }

                        entry.state = code.state;
                        entry.city = code.city;
                    }
                }

                // Combine ftime with fdate if possible
                if(entry.ftime && entry.fdate) {
                    entry.fdate.setHours(entry.ftime.getHours());
                    entry.fdate.setMinutes(entry.ftime.getMinutes());
                }

                // Return modified entry
                return entry;
            });

            if(callback!==undefined) {
                callback(newData);
            }else{
                return newData;
            }
        },
        //
        //
        //
    }; // End of obj definition

    // Make sure all user keys are valid keys. Justification is to preserve
    // the read-only-ness of keys in `obj`.
    var allowedKeys = Object.keys(defaults),
        userKeys = Object.keys(params);

    userKeys.forEach(function(userKey) {
        if(allowedKeys.indexOf(userKey)<0) {
            // Key is not permissible.
            throw "Invalid key ("+ userKey +")";
        }
    });

    $.extend(true, defaults, params);

    // Write customizable parameters into object
    $.extend(true, obj, defaults);

    // Start up the object and return it.
    obj.init();
    return obj;
}



function daysBetween(start, end) {
    // Calculate number of days between two dates (rounding up, so 2.1 = 3)
    var oneDay = 86400000, // 24hrs * 60mins * 60secs * 1000ms = 86400000ms
        d1ms = start.getTime(),
        d2ms = end.getTime();
    return Math.ceil(Math.abs((d2ms - d1ms) / oneDay));
}
