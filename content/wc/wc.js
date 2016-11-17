function WebcamDemo(params) {
	// First check browser support and get function to call
	if(!navigator.getUserMedia) {
		// Webcam not supported
		throw "Browser does not support WebRTC"
	}
	
	var instanceParams = {
		// Configurable parameters
		//
		vidID				:	'vid',
		canvasID			:   'cvs',
		rawCanvasID			:   'raw-cvs',
		fps					:   60,
		rawCanvasSize		:   300,		// balance speed vs. classification accuracy
		width				:   null,
		height				:   null,
		classifier			:   jsfeat.haar.eye,
		stroke				:   "rgb(255,0,0)",
	};
	
	// Load user-specified parameters, but make sure they're all valid
	var validKeys = Object.keys(instanceParams);
	for(var key in params) {
		if(validKeys.indexOf(key)>-1) {
			instanceParams[key] = params[key]
		}else{
			// Not a configurable parameters
			throw "Illegal Parameter: "+key
		}
	}
	
	// The object
	var obj = {
		//
		// Non-configurable parameters
		//
		video				:   null,
		$video				:   null,
		canvas				:   null,
		$canvas				:   null,
		rawCanvas			:   null,
		$rawCanvas			:   null,
		ctx					:   null,
		rawCtx				:   null,
		timeout				:   null,
		_default			:   {
			width	:	800,
			height  :   600,
		},
		workWidth			:	null,
		workHeight			:	null,
		//
		//
		//
		init : function() {
			var that = this;
			
			// Make a video element on the page
			if(!$('#'+that.vidID).length) {
				$('<video>').appendTo('body').prop('id', that.vidID);
			}
			that.$video = $('#'+that.vidID);
			that.video = that.$video[0];
			that.$video.prop('autoplay', true).hide();
			
			// Make the canvas element
			if(!$('#'+that.canvasID).length) {
				$('<canvas>').appendTo('body').prop('id', that.canvasID);
			}
			that.$canvas = $('#'+that.canvasID);
			that.canvas = that.$canvas[0];
			that.ctx = that.canvas.getContext('2d');
			
			// Set context colors by config params
			that.ctx.strokeStyle = this.stroke;
			
			// Make the raw canvas element -- 
			if(!$('#'+that.rawCanvasID).length) {
				$('<canvas>').appendTo('body').prop('id', that.rawCanvasID);
			}
			that.$rawCanvas = $('#'+that.rawCanvasID).hide();
			that.rawCanvas = that.$rawCanvas[0];
			that.rawCtx = that.rawCanvas.getContext('2d');
			
			// Set & sync dimensions
			that.setAllSizes();	
			
			navigator.getUserMedia({video: true, audio: false},
				function(stream) {
					that.video.src = window.URL.createObjectURL(stream);
					
					that.$video.on('loadedmetadata', function(e) {
						// Time to start video. Put things to update in this closure.
						that.processStream();
					});
				}, that.videoStreamLoadError);
		},
		//
		//
		//
		drawRects : function(ctx, rects, scale, num) {
			var n = Math.min(rects.length, num || rects.length);
			if(n) {
				jsfeat.math.qsort(rects, 0, rects.length-1, function(a,b){ return b.confidence<a.confidence;});
			}else{
				return null;
			}
			
			var r;
			for(var i=0; i<n; i++) {
				r = rects[i];
				ctx.strokeRect((r.x*scale)|0, (r.y*scale)|0, (r.width*scale)|0, (r.height*scale)|0);
			}
		},
		//
		//
		//
		processStream : function() {
			// Process video stream
			var that = this;
			
			var w = that.workWidth,
				h = that.workHeight,
				iW = that.width,
				iH = that.height,
				fps = that.fps,
				video = that.video,
				l = (w+1) * (h+1),
				rawCtx = that.rawCtx,
				ctx = that.ctx,
				currentFrame, rects,
				classifier = that.classifier,
				jsfImg = new jsfeat.matrix_t(w, h, jsfeat.U8_t | jsfeat.C1_t)
				ii_sum = new Int32Array(l),
				ii_sqsum = new Int32Array(l),
				ii_tilted = new Int32Array(l),
				ii_canny = new Int32Array(l),
				scale = that.width / jsfImg.cols;
				
			
			
			!function tick() {
				// Closure that updates screen on tick
				window.requestAnimationFrame(tick);
				
				if(video.readyState===video.HAVE_ENOUGH_DATA) {
					// draw image to screen
					rawCtx.drawImage(video, 0, 0, w, h);
					ctx.drawImage(video, 0, 0, iW, iH);
				
					// -- Play with the image -- //
					currentFrame = rawCtx.getImageData(0, 0, w, h);
					
					jsfeat.imgproc.grayscale(currentFrame.data, jsfImg.data);
					jsfeat.imgproc.equalize_histogram(jsfImg, jsfImg);
					
					jsfeat.imgproc.compute_integral_image(jsfImg,
														  ii_sum,
														  ii_sqsum,
														  classifier.tilted? ii_tilted : null);
					
					
					rects = jsfeat.haar.detect_multi_scale(ii_sum, ii_sqsum, ii_tilted,
														   null,//this.imgIntegral.canny,
													       jsfImg.cols, jsfImg.rows,
														   classifier, 1.2, 2); 
					rects = jsfeat.haar.group_rectangles(rects, 1);
					
					that.drawRects(ctx, rects, scale, 2);
					
					
					// -- End image manipulation -- //
				}
			}();
		},
		//
		//
		//
		setAllSizes : function() {
			// Set sizes of canvas and video, make sure they are same
			// as this object's stored dimensions
			var that = this;
			
			var s = ['width', 'height'].map(function(dim) {
				var d = that[dim],
					v = that.video[dim],
					c = that.canvas[dim],
					_d = that['_default'][dim],
					n;
				
				// Priority: user-specified dimensions (with params on init)
				//			 video dimensions
				//			 canvas dimensions
				//			 default dimensions (800 x 600)
				n = (d!==null)? d : v || c || _d;
				
				// Set dimensions
				return that[dim] = that.video[dim] = that.canvas[dim] = n;
			});
			
			// Set raw canvas size to scale
			var scale = Math.min(that.rawCanvasSize/s[0],
								 that.rawCanvasSize/s[1]);
			that.rawCanvas.width = that.workWidth = (s[0]*scale)|0,
			that.rawCanvas.height = that.workHeight = (s[1]*scale)|0;
			
			return s;
		},
		//
		//
		//
		videoStreamLoadError : function(e) {
			console.log("Error loading video stream: " + e);
			document.write("Error loading video stream: " + e);
		},
		//
		//
		//
	};
	
	// Set all the settings
	$.extend(true, obj, instanceParams);
	
	// Flip the switch!
	obj.init();
	
	return obj;
};



