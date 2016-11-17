movement : function(newFrame, oldFrame) {
			// Calculate difference between newest and second newest frames
			var b = function(n) { return n<50? false : true; };
			if(b(abs(newFrame[0] - oldFrame[0])) || 
			   b(abs(newFrame[1] - oldFrame[1])) ||
			   b(abs(newFrame[2] - oldFrame[2]))) {
				return [0xFF, 0xFF, 0xFF, 0xFF];
			}else{
				return [0x00, 0x00, 0x00, 0xFF];   
			}
		},
		//
		//
		//
		cycle : function(newFrame, oldFrame) { 
			return
		},
		//
		//
		//
		applyHistoryFilter : function(oldFrame, newFrame, target, func) {
			var i = 0,
				x, y,
				t;
			while(i < (target.length*.25)) {
				x = y = z = i<<2;
				t = func([
					newFrame[y++], newFrame[y++], newFrame[y++], newFrame[y++]
				],
				[
					oldFrame[z++], oldFrame[z++], oldFrame[z++], oldFrame[z++]
				]);
				target[x++] = t[0];
				target[x++] = t[1];
				target[x++] = t[2];
				target[x++] = t[3];
				++i;
			}
		},
		
		
		
		
function abs(x) {
	// absolute value of integers, fast
	return (x ^ (x >> 31)) - (x >> 31);
}