var labelType, useGradients, nativeTextSupport, animate;

(function() {
  var ua = navigator.userAgent,
      iStuff = ua.match(/iPhone/i) || ua.match(/iPad/i),
      typeOfCanvas = typeof HTMLCanvasElement,
      nativeCanvasSupport = (typeOfCanvas == 'object' || typeOfCanvas == 'function'),
      textSupport = nativeCanvasSupport 
        && (typeof document.createElement('canvas').getContext('2d').fillText == 'function');
  //I'm setting this based on the fact that ExCanvas provides text support for IE
  //and that as of today iPhone/iPad current text support is lame
  labelType = (!nativeCanvasSupport || (textSupport && !iStuff))? 'Native' : 'HTML';
  nativeTextSupport = labelType == 'Native';
  useGradients = nativeCanvasSupport;
  animate = !(iStuff || !nativeCanvasSupport);
})();

var Log = {
  elem: false,
  write: function(text){
    if (!this.elem) 
      this.elem = document.getElementById('log');
    this.elem.innerHTML = text;
    this.elem.style.left = (500 - this.elem.offsetWidth / 2) + 'px';
  }
};


function init(){
    //init data
	var json = {"id": 146795916, "name": "POTUS", "children": [{"id": 147211904, "name": "Occupation: Planter", "children": [{"id": 147211472, "name": "George Washington", "children": []}]},{"id": 146801584, "name": "Occupation: Business", "children": [{"id": 146801944, "name": "Age: 50s", "children": [{"id": 146802088, "name": "Millions of Dollars: Many", "children": [{"id": 146801896, "name": "George W. Bush", "children": []}]},{"id": 146802016, "name": "Millions of Dollars: A Few", "children": [{"id": 146801992, "name": "Warren G. Harding", "children": []}]}]},{"id": 146801872, "name": "Age: 60s", "children": [{"id": 146802208, "name": "Millions of Dollars: Many", "children": [{"id": 146802184, "name": "George H. W. Bush", "children": []}]},{"id": 146802280, "name": "Millions of Dollars: Zero", "children": [{"id": 146802112, "name": "Harry S. Truman", "children": []}]}]}]},{"id": 146801608, "name": "Occupation: Academic", "children": [{"id": 146801680, "name": "Age: 50s", "children": [{"id": 146801752, "name": "Millions of Dollars: Many", "children": [{"id": 146801704, "name": "Lyndon B. Johnson", "children": []}]},{"id": 146801824, "name": "Millions of Dollars: Zero", "children": [{"id": 146801632, "name": "Woodrow Wilson", "children": []}]}]}]},{"id": 147210656, "name": "Occupation: Other", "children": [{"id": 147211784, "name": "Millions of Dollars: Many", "children": [{"id": 147211520, "name": "Herbert Hoover", "children": []}]},{"id": 147211592, "name": "Millions of Dollars: A Few", "children": [{"id": 147211688, "name": "Age: 50s", "children": [{"id": 147211664, "name": "Jimmy Carter", "children": []}]},{"id": 147211736, "name": "Age: 60s", "children": [{"id": 147211568, "name": "Ronald Reagan", "children": []}]}]},{"id": 147211856, "name": "Millions of Dollars: Too Many", "children": [{"id": 147211712, "name": "John F. Kennedy", "children": []}]}]},{"id": 146802256, "name": "Occupation: Military", "children": [{"id": 147210800, "name": "Age: 40s", "children": [{"id": 147210944, "name": "Millions of Dollars: Zero", "children": [{"id": 147210752, "name": "Ulysses S. Grant", "children": []}]},{"id": 147210872, "name": "Millions of Dollars: Too Many", "children": [{"id": 147210848, "name": "Theodore Roosevelt", "children": []}]}]},{"id": 147210728, "name": "Age: 60s", "children": [{"id": 147211040, "name": "Millions of Dollars: A Few", "children": [{"id": 147211496, "name": "Foreign Language Skills: Respectable", "children": [{"id": 147211016, "name": "William Henry Harrison", "children": []}]},{"id": 147211112, "name": "Foreign Language Skills: Nonexistent", "children": [{"id": 147211160, "name": "Love of Animals: Passive", "children": [{"id": 147211208, "name": "Height: Average", "children": [{"id": 147211280, "name": "Weight: Obese", "children": [{"id": 147211256, "name": "Zachary Taylor", "children": []}]},{"id": 147211448, "name": "Weight: Overweight", "children": [{"id": 147211184, "name": "Dwight D. Eisenhower", "children": []}]}]}]}]}]}]}]},{"id": 146801800, "name": "Occupation: Law", "children": [{"id": 146802400, "name": "Faith: Protestant", "children": [{"id": 146802352, "name": "Love of Animals: Passive", "children": [{"id": 146802616, "name": "Millions of Dollars: Many", "children": [{"id": 146803768, "name": "Weight: Obese", "children": [{"id": 146803264, "name": "Grover Cleveland", "children": []}]},{"id": 146803336, "name": "Weight: Average", "children": [{"id": 146803384, "name": "Age: 50s", "children": [{"id": 146803360, "name": "Foreign Language Skills: Respectable", "children": [{"id": 146803624, "name": "Height: Tall", "children": [{"id": 146803456, "name": "John Tyler", "children": []}]},{"id": 146803528, "name": "Height: Short", "children": [{"id": 146803504, "name": "Martin Van Buren", "children": []}]}]},{"id": 146803432, "name": "Foreign Language Skills: Nonexistent", "children": [{"id": 146803000, "name": "Richard Nixon", "children": []}]}]},{"id": 146803696, "name": "Age: 60s", "children": [{"id": 146803312, "name": "John Adams", "children": []}]}]},{"id": 146803672, "name": "Weight: Overweight", "children": [{"id": 146803864, "name": "Age: 40s", "children": [{"id": 146803840, "name": "Bill Clinton", "children": []}]},{"id": 146803792, "name": "Age: 50s", "children": [{"id": 146804008, "name": "Foreign Language Skills: Superior", "children": [{"id": 146803888, "name": "John Quincy Adams", "children": []}]},{"id": 146803960, "name": "Foreign Language Skills: Negligible", "children": [{"id": 146803936, "name": "James Monroe", "children": []}]}]}]}]},{"id": 146802664, "name": "Millions of Dollars: A Few", "children": [{"id": 146803240, "name": "Foreign Language Skills: Respectable", "children": [{"id": 146802640, "name": "James K. Polk", "children": []}]},{"id": 146802736, "name": "Foreign Language Skills: Nonexistent", "children": [{"id": 146802784, "name": "Age: 50s", "children": [{"id": 146802832, "name": "Height: Average", "children": [{"id": 146802904, "name": "Weight: Obese", "children": [{"id": 146802808, "name": "William Howard Taft", "children": []}]},{"id": 146802880, "name": "Weight: Average", "children": [{"id": 146802448, "name": "Millard Fillmore", "children": []}]}]},{"id": 146802760, "name": "Height: Short", "children": [{"id": 146803120, "name": "Weight: Obese", "children": [{"id": 146802976, "name": "William McKinley", "children": []}]},{"id": 146803072, "name": "Weight: Average", "children": [{"id": 146803048, "name": "Benjamin Harrison", "children": []}]}]}]},{"id": 146803192, "name": "Age: 60s", "children": [{"id": 146802712, "name": "Gerald Ford", "children": []}]}]}]},{"id": 146804056, "name": "Millions of Dollars: Too Many", "children": [{"id": 146803216, "name": "James Madison", "children": []}]},{"id": 146803984, "name": "Millions of Dollars: Zero", "children": [{"id": 146803552, "name": "Foreign Language Skills: Respectable", "children": [{"id": 146804176, "name": "Height: Tall", "children": [{"id": 146804272, "name": "Weight: Average", "children": [{"id": 146804248, "name": "James A. Garfield", "children": []}]},{"id": 146804152, "name": "Weight: Overweight", "children": [{"id": 146804368, "name": "Age: 50s", "children": [{"id": 146804344, "name": "Chester A. Arthur", "children": []}]},{"id": 146804440, "name": "Age: 60s", "children": [{"id": 146804296, "name": "James Buchanan", "children": []}]}]}]}]}]}]},{"id": 146802472, "name": "Love of Animals: Enthusiastic", "children": [{"id": 146802544, "name": "Age: 50s", "children": [{"id": 146802520, "name": "Franklin D. Roosevelt", "children": []}]},{"id": 146802592, "name": "Age: 60s", "children": [{"id": 146802424, "name": "Andrew Jackson", "children": []}]}]},{"id": 146804488, "name": "Love of Animals: Zookeeper", "children": [{"id": 146802568, "name": "Calvin Coolidge", "children": []}]}]},{"id": 146802328, "name": "Faith: Unspecified", "children": [{"id": 146804560, "name": "Age: 40s", "children": [{"id": 146804608, "name": "Millions of Dollars: A Few", "children": [{"id": 146804704, "name": "Foreign Language Skills: Negligible", "children": [{"id": 146804680, "name": "Barack Obama", "children": []}]},{"id": 147210272, "name": "Foreign Language Skills: Nonexistent", "children": [{"id": 146804584, "name": "Franklin Pierce", "children": []}]}]}]},{"id": 146804512, "name": "Age: 50s", "children": [{"id": 147210368, "name": "Millions of Dollars: A Few", "children": [{"id": 147210344, "name": "Rutherford B. Hayes", "children": []}]},{"id": 147210440, "name": "Millions of Dollars: Too Many", "children": [{"id": 147210296, "name": "Thomas Jefferson", "children": []}]},{"id": 147210320, "name": "Millions of Dollars: Zero", "children": [{"id": 147210560, "name": "Foreign Language Skills: Nonexistent", "children": [{"id": 147210632, "name": "Love of Animals: Enthusiastic", "children": [{"id": 147210608, "name": "Abraham Lincoln", "children": []}]},{"id": 147210680, "name": "Love of Animals: None", "children": [{"id": 147210512, "name": "Andrew Johnson", "children": []}]}]}]}]}]}]}]};
    //end
	
	
    //init RGraph
    var rgraph = new $jit.RGraph({
		// Animation speed (ms)
		duration: 500,
        //Where to append the visualization
        injectInto: 'infovis',
        //Optional: create a background canvas that plots
        //concentric circles.
        background: {
          CanvasStyles: {
            strokeStyle: '#999'
          }
        },
        //Add navigation capabilities:
        //zooming by scrolling and panning.
        Navigation: {
          enable: true,
          panning: true,
          zooming: 10
        },
        //Set Node and Edge styles.
        Node: {
            color: '#33a',
			type: 'star',
			autoHeight: true
        },
        
        Edge: {
          color: '#f99',
          lineWidth:1.5
        },

        onBeforeCompute: function(node){
            Log.write(node.name);
            //Add the relation list in the right column.
            //This list is taken from the data property of each JSON node.
            $jit.id('inner-details').innerHTML = node.data.relation;
        },
        
        //Add the name of the node in the correponding label
        //and a click handler to move the graph.
        //This method is called once, on label creation.
        onCreateLabel: function(domElement, node){
            domElement.innerHTML = node.name;
            domElement.onclick = function(){
                rgraph.onClick(node.id, {
                    onComplete: function() {
                        //Log.write("done");
                    }
                });
            };
        },
        //Change some label dom properties.
        //This method is called each time a label is plotted.
        onPlaceLabel: function(domElement, node){
            var style = domElement.style;
            style.display = '';
            style.cursor = 'pointer';

			if (node._depth == 0) {
				style.fontSize = "0.8em";
				style.color = "#f33";
			}else if (node._depth == 1) {
                style.fontSize = "0.8em";
                style.color = "#111";
            
            } else if(node._depth == 2){
                style.fontSize = "0.7em";
                style.color = "#555";
            
            } else {
                style.display = 'none';
            }

            var left = parseInt(style.left);
            var w = domElement.offsetWidth;
            style.left = (left - w / 2) + 'px';
        }
    });
    //load JSON data
    rgraph.loadJSON(json);
    //trigger small animation
    rgraph.graph.eachNode(function(n) {
      var pos = n.getPos();
      pos.setc(-200, -200);
    });
    rgraph.compute('end');
    rgraph.fx.animate({
      modes:['polar'],
      duration: 2000
    });
    //end
    //append information about the root relations in the right column
    $jit.id('inner-details').innerHTML = rgraph.graph.getNode(rgraph.root).data.relation;
}