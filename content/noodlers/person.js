var jn = jn || {};


jn.Person = function ()
{
	// Person class
	return {
		// Properties
		//
		id			: 0,
		//
		// SUPERFICIAL / NOMINAL / COSMETIC
		//
		name			: {
			title 	: '',
			first 	: '',
			middle	: '',
			last	: '',
			suffix	: ''
		},
		sex				: '',
		gender			: '',
		hair			: {
			color	: '',
		},
		eye			: {
			color	: ''
		},
		//
		// ATTITUDE / BEHAVIOR / DISPOSITION
		//
		// - Relational emotive dimensions.
		// -- Default values. Relational emotions define the
		// -- behavior of this person towards another. The relations are
		// -- stored in memory and recovered upon recognition.
		Relation			: function () {
			return {
				familiarity		: 0,		// domain [0,1]
				attraction		: 0,		// domain [0,1]
				intrigue		: 0,		// domain [0,1]
				trust			: 0,		// domain [0,1]
				intimacy		: 0,		// domain [0,1]
			};
		},
		//
		// MEMORY
		//
		Memory				: function () {
			return {
				type			: null,
				relationship 	: {},
				appearance		: {},
				facts			: {},
				experiences		: {
					conversations	: [],
				},
			};
		},
		//
		// BODILY (SENSORY) INPUTS
		//
		ear					: [],
		eye					: [],
		nose				: [],
		skin				: [],
		mouth				: [],
		//
		// INTERACTIONS
		//
		Conversation 		: function (b, setting) {
			return {
				// Conversation class, between this person and `b` at `setting`
				//
				// - Participant
				//
				interlocutor	: b,
				//
				// - Setting
				//
				setting			: (setting===undefined)? {startTime : new Date(), air : {sounds:[]}} : setting,
				//
				// - Conversation navigational dimensions
				// -- Default values. These will be adjusted by an initialization function
				// -- that sets the starting point of a conversation by examining the
				// -- memories of the two people. Remember solipsism; conversation vector
				// -- is perceived differently by each participant.
				dimensions		: {
					friendliness	: 0,			// domain [-1, 1]
					respect			: 0,			// domain [-1, 1]
					interest		: 0,			// domain [-1, 1]
					comfort			: 0,			// domain [-1, 1]
					tone			: 0,			// domain [-1, 1]
				},
				//
				// - Record (of what was spoken)
				//
				record			: [],
				//
				//
				// THOUGHT PRIMITIVES
				//
				encodeAsSpeechAct : function (intention) {
					// Take an intention and encode it as a speech act
					// Involves selecting appropriate phrase based on
					// intention.
				},
				//
				// PRIMITIVE ACTIONS
				//
				emit : function(gesture, target) {
					var that = this;
					if(target===undefined) target = that.setting.air.sounds;
					target.push(gesture);
					return this;
				},
					
				//
				// COMPLEX ACTIONS
				//
				initiate : function (intention) {
					var that = this;
					if( record.length>0 ) return false;
					that.emit(that.encodeInLanguage(intention), b.ear);
				},
			};
		},
	};
};