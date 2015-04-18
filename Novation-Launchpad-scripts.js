/****************************************************************/
/*      Novation Launchpad Mapping                            */
/*      For Mixxx version 1.11                                  */
/*      Author: zestoi / johnko                                 */
/****************************************************************/

NovationLaunchpad = {

	init: function() {

		//
		// setup variables and methods
		//

		this.page = 1;
		this.deckone = 1; // default 1, can be 3 for 3+4th decks
		this.decktwo = this.deckone+1;
		this.shift = 0;
		this.shift2 = 0;
		this.callbacks = {};
		this.feedbacks = {};
		this.cache = [{}, {}, {}, {}];
		this.feedback_cache = {};
		this.toggle_cache = [{}, {}, {}, {}];
		this.name2control = {};
		this.control2name = {};
		this.vumeters = [];
		this.shapesbyname = [];
		this.testshapeindex = 0;
		this.stopanimation = false;

		var self = NovationLaunchpad;
		self.instance = this; // needed for incoming data from the launchpad

		this.colors = self.colors();
		this.capture = self.capture;
		this.feedback = self.feedback;
		this.send = self.send;
		this.button = self.button;
		this.toggle = self.toggle;
		this.hotcue = self.hotcue;
		this.flanger = self.flanger;
		this.jog = self.jog;
		this.get = self.get;
		this.loop = self.loop;
		this.gator = self.gator;
		this.set_page = self.set_page;
		this.vfader = self.vfader;
		this.vumeter = self.vumeter;
		this.vumeter_toggle = self.vumeter_toggle;
		this.playlist = self.playlist;
		this.shapes = self.shapes();

		//
		// map the midi config into something more useful
		//

		var buttons = self.buttons();
		for (name in buttons) {
			var type = buttons[name][0];
			var chan = buttons[name][1];
			var value = buttons[name][2];
			var status = (type == 'cc') ? 0xb0 + chan - 1 : 0x90 + chan - 1;
			this.name2control[name]= [ status, value ];
			this.control2name["" + status + value] = name; // stringify it
		}

		for (name in this.shapes) {
			this.shapesbyname.push(name);
		}

		//
		// reset device, enable flashing colors
		//

		midi.sendShortMsg(0xb0, 0x0, 0x0);
		midi.sendShortMsg(0xb0, 0x0, 0x28);

		/////////////////////////////////////////////////////////////////////////
		// button layout mapping starts here
		/////////////////////////////////////////////////////////////////////////

		// shift buttons

		this.toggle("vol", "all", 2, 'hi_red', 'lo_red', '', '', function(g, n, v) { this.vumeter_toggle(v); });

		this.button("arm", "all", 1, 'hi_yellow', 'lo_yellow', '', '', function(g, n, v) { this.shift = v > 0 ? 1 : 0; });
		this.button("solo", "all", 1, 'hi_yellow', 'lo_yellow', '', '', function(g, n, v) { this.shift2 = v > 0 ? 1 : 0; });

		//// MAIN PAGE ////

		// track navigation

		this.playlist("up", 0, "SelectPrevTrack");
		this.playlist("down", 0, "SelectNextTrack");

		// load song to decks

		this.button("left", "press", 0, 'hi_orange', 'lo_orange', "[Channel"+this.deckone+"]", "LoadSelectedTrack");
		this.button("right", "press", 0, 'hi_orange', 'lo_orange', "[Channel"+this.decktwo+"]", "LoadSelectedTrack");

		// deck/mixer page

		this.button("session", "all", 0, 'hi_red', 'lo_red', '', '', function(g, n, v) { this.set_page( 1 ); });
		this.button("user1", "all", 0, 'hi_red', 'lo_red', '', '', function(g, n, v) { this.set_page( 3 ); });
		this.button("user2", "all", 0, 'hi_red', 'lo_red', '', '', function(g, n, v) { this.set_page( 4 ); });
		this.button("mixer", "all", 0, 'hi_red', 'lo_red', '', '', function(g, n, v) { this.set_page( 2 ); });

		// crossfader
		this.cfader(0, 0, 0, 8, 'lo_green', 'black', "[Master]", "crossfader");

		// Beat blinker

		this.beatblinker('left' , 0, 'hi_yellow'  , 'lo_orange', "[Channel"+this.deckone+"]" );
		this.beatblinker('right', 0, 'hi_yellow'  , 'lo_orange', "[Channel"+this.decktwo+"]" );

		// deck mappings

		for (deck=this.deckone; deck<=this.decktwo; deck++) {
			var offset = deck == this.deckone ? 0 : 4;
			var group = "[Channel" + deck + "]";

			// tracks

			this.toggle("1," + (offset + 0), "all", 1, 'hi_red', 'lo_red', group, "quantize");
			this.toggle("1," + (offset + 1), "all", 1, 'hi_red', 'lo_red', group, "keylock");
			this.toggle("1," + (offset + 2), "all", 1, 'hi_orange', 'lo_orange', group, "pfl");
			//this.button("0," + (offset + 3), "all", 1, 'hi_yellow', 'lo_amber', group, "LoadSelectedTrack");

			// flanger

			//this.flanger("1," + (offset + 0), 1, group, 0.5, 1500000, 333);
			//this.flanger("1," + (offset + 1), 1, group, 1, 500000, 666);

			// brake effect

			this.toggle("1," + (offset + 3), "all", 1, 'hi_red', 'lo_red', group, "", function(g, n, v) {
				engine.brake(parseInt(g.substring(8,9)), v > 0);
			});

			// instant loops

			this.button("2," + (offset + 0), "press", 1, 'hi_yellow', 'lo_yellow', group, "", function(g, name, v) {
				var size = 1;
				var bpm = engine.getValue(g,"file_bpm");
				var onebeatms = 60000/bpm;
				engine.setValue(g, "beatloop_" + size + "_activate", 1);
				engine.beginTimer( onebeatms/size*1.5, function(){
					if (engine.getValue(g, "beatloop_" + size + "_enabled")) {
						engine.setValue(g, "beatloop_" + size + "_toggle", 1);
						//engine.setValue(g, "beatjump_" + 4 + "_forward", 1);
					}
				}, true);
			});
			this.loop("2," + (offset + 1), 1, group, 0.5);
			this.loop("2," + (offset + 2), 1, group, 0.25);
			this.loop("2," + (offset + 3), 1, group, 0.125);

			// loop in or loop half when active

			this.button("3," + (offset + 0), "press", 1, 'hi_green', 'lo_green', group, "", function(g, n, v) {
				if (engine.getValue(g, "loop_enabled")) {
					engine.setValue(g, "loop_halve", 1);
				}
				else {
					engine.setValue(g, "loop_in", 1);
				}
			});

			// loop out or loop double when active

			this.button("3," + (offset + 1), "press", 1, 'hi_green', 'lo_green', group, "", function(g, n, v) {
				if (engine.getValue(g, "loop_enabled")) {
					engine.setValue(g, "loop_double", 1);
				}
				else {
					engine.setValue(g, "loop_out", 1);
				}
			});

			// reloop or exit loop

			this.button("3," + (offset + 2), "all", 1, 'hi_green', 'lo_green', group, "reloop_exit");

			// gator effect

			//this.gator("3," + (offset + 3),  1, group, 8, 0.7);

			// spinback effect

			this.toggle("3," + (offset + 3), "all", 1, 'hi_red', 'lo_red', group, "", function(g, n, v) {
				engine.spinback(parseInt(g.substring(8,9)), v > 0, 3);
			});

			// led feedback for loop in/out buttons to show loop status

			engine.connectControl(group, "loop_enabled", function(value, g, e) {
				var offset = g == "[Channel"+this.deckone+"]" ? 0 : 4; // value not closed
				this.send("3," + (offset + 0), this.colors[value > 0 ? 'hi_green' : 'lo_green'], 1);
				this.send("3," + (offset + 1), this.colors[value > 0 ? 'hi_green' : 'lo_green'], 1);
				this.feedback_cache[g + e] = value;
			});

			// hotcues or needle drop with shift2 pressed

			this.hotcue("4," + (offset + 0), 1, group, 1);
			this.hotcue("4," + (offset + 1), 1, group, 2);
			this.hotcue("4," + (offset + 2), 1, group, 3);
			this.hotcue("4," + (offset + 3), 1, group, 4);
			this.hotcue("5," + (offset + 0), 1, group, 5);
			this.hotcue("5," + (offset + 1), 1, group, 6);
			this.hotcue("5," + (offset + 2), 1, group, 7);
			this.hotcue("5," + (offset + 3), 1, group, 8);

			// transport

			this.button("6," + (offset + 0), "all", 1, 'hi_green', 'lo_red', group, "cue_default");

			this.button("6," + (offset + 1), "press", 1, 'hi_orange', 'lo_orange', group, "rate", function(g, n, v) {
				engine.setValue(g, n, 0);
			});

			this.button("6," + (offset + 2), "press", 1, 'hi_yellow', 'lo_yellow', group, "rate_perm_down_small");
			this.button("6," + (offset + 3), "press", 1, 'hi_yellow', 'lo_yellow', group, "rate_perm_up_small");

			// play button
			this.toggle("7," + (offset + 0), "press", 1, 'hi_green', 'lo_red', group, "play");

			// flash play button when near end of track
			engine.connectControl(group, "playposition", function(value, g, e) {
				if (value > 0.9 && engine.getValue(g, "play") > 0) {
					this.send(g == "[Channel"+this.deckone+"]" ? "7,0" : "7,4", this.colors['flash_hi_red'], 1);
					this.send("session", this.colors['flash_hi_red'], 0);
				}
				else if (value < 0.9 && engine.getValue(g, "play") > 0) {
					this.send(g == "[Channel"+this.deckone+"]" ? "7,0" : "7,4", this.colors['hi_green'], 1);
					this.send("session", this.colors['lo_red'], 0);
				}
				else {
					this.send("session", this.colors['lo_red'], 0);
				}
				this.feedback_cache[g + e] = value;
			});

			// sync or move beatgrid when shift is pressed

			this.button("7," + (offset + 1), "all", 1, 'hi_orange', 'lo_orange', group, "beatsync", function(g, n, v) {
				if (this.shift > 0)
					engine.setValue(g, "beats_translate_curpos", v > 0 ? 1 : 0);
				else
					engine.setValue(g, n, v > 0 ? 1 : 0);
			});

			// fwd/rev when not playing unless shift and then fine jog movements for beat gridding, jog when playing, jog more when shift+playing

			this.jog("7," + (offset + 2), 1, group, "back");
			this.jog("7," + (offset + 3), 1, group, "fwd");
		}

		//// MIXER PAGE ////

		this.toggle("1,0", "all", 2, 'flash_hi_red', 'lo_red', "[Channel"+this.deckone+"]", "filterLowKill");
		this.toggle("1,1", "all", 2, 'flash_hi_red', 'lo_red', "[Channel"+this.deckone+"]", "filterMidKill");
		this.toggle("1,2", "all", 2, 'flash_hi_red', 'lo_red', "[Channel"+this.deckone+"]", "filterHighKill");
		this.toggle("1,5", "all", 2, 'flash_hi_red', 'lo_red', "[Channel"+this.decktwo+"]", "filterLowKill");
		this.toggle("1,6", "all", 2, 'flash_hi_red', 'lo_red', "[Channel"+this.decktwo+"]", "filterMidKill");
		this.toggle("1,7", "all", 2, 'flash_hi_red', 'lo_red', "[Channel"+this.decktwo+"]", "filterHighKill");

		this.vfader( 7, 0, 2, 6, 'hi_orange' , 'black', "[Channel"+this.deckone+"]", "filterLow");
		this.vfader( 7, 1, 2, 6, 'hi_amber'  , 'black', "[Channel"+this.deckone+"]", "filterMid");
		this.vfader( 7, 2, 2, 6, 'hi_yellow' , 'black', "[Channel"+this.deckone+"]", "filterHigh");
		this.vfader( 7, 5, 2, 6, 'hi_orange' , 'black', "[Channel"+this.decktwo+"]", "filterLow");
		this.vfader( 7, 6, 2, 6, 'hi_amber'  , 'black', "[Channel"+this.decktwo+"]", "filterMid");
		this.vfader( 7, 7, 2, 6, 'hi_yellow' , 'black', "[Channel"+this.decktwo+"]", "filterHigh");

		this.vfader( 7, 3, 2, 7, 'hi_green'  , 'black', "[Channel"+this.deckone+"]", "volume");
		this.vfader( 7, 4, 2, 7, 'hi_green'  , 'black', "[Channel"+this.decktwo+"]", "volume");
		this.vumeter(7, 3, 2, 7, 'hi_green'  , 'black', "[Channel"+this.deckone+"]", "VuMeter");
		this.vumeter(7, 4, 2, 7, 'hi_green'  , 'black', "[Channel"+this.decktwo+"]", "VuMeter");

		//// VISUALIZATION ////

		this.button('stop', 'press', 3, 'hi_red', 'lo_red', '', '', function(g,n,v){
			this.stopanimation = true;
		});
		this.nextshape('arm' , this.shapesbyname, 3, 'hi_green', 'black',  1);
		this.nextshape('solo', this.shapesbyname, 3, 'hi_green', 'black', -1);
		this.button('2,4', 'press', 3, 'black', 'black', '', '', function(g,n,v){
			this.stopanimation = false;
			this.animateshapestimer([
				'lucky0',
				'lucky1',
				'lucky2',
				'lucky3',
				'l','u','c','k','y'
			], 500, 3, 'hi_green', 'black', 1, 0);
		});
		this.button('3,4', 'press', 3, 'black', 'black', '', '', function(g,n,v){
			this.stopanimation = false;
			this.animateshapestimer([
				'star0',
				'star1',
				'star2',
				'star3',
				's','t','a','r'
			], 500, 3, 'hi_yellow', 'black', 1, 0);
		});
		this.button('4,4', 'press', 3, 'black', 'black', '', '', function(g,n,v){
			this.stopanimation = false;
			this.animateshapestimer([
				'heart0',
				'heart1',
				'heart2',
				'heart3',
				'l','o','v','e'
			], 500, 3, 'hi_red', 'black', 1, 0);
		});

		/////////////////////////////////////////////////////////////////////////
		// button layout mapping ends here
		/////////////////////////////////////////////////////////////////////////
	},

	//
	// empty shutdown method
	//

	shutdown: function() {
	},

	//
	// convert incoming midi to a 'name' and call callbacks (if any)
	//

	incomingData: function(channel, control, value, status, group) {
		var me = NovationLaunchpad.instance;
		if ((name = me.control2name["" + status + control]) != undefined) {
			if (me.callbacks[name] != undefined) {
				var callbacks = me.callbacks[name];
				for (var i=0; i<callbacks.length; i++) {
					if ((callbacks[i][1] == 0 || callbacks[i][1] == me.page) && typeof(callbacks[i][2]) == 'function') {

						//
						// check we need to call for this value change: all, press, release
						//

						if (callbacks[i][0] == "all" ||
							(callbacks[i][0] == "press" && value > 0) ||
							(callbacks[i][0] == "release" && value == 0)) {

							//
							// call a callback function for this control
							//

							callbacks[i][2].call(me, group, name, value);
						}
					}
				}
			}
		}
	},

	//
	// gator effect using high eq kill
	//

	gator: function(name, page, group, rate, depth) {
		this.button(name, "all", page, 'hi_red', 'lo_red', group, "", function(g, n, v) {
			var self = NovationLaunchpad;
			if (typeof(self.gator_timer) != undefined && self.gator_timer != null) {
				engine.stopTimer(self.gator_timer);
				self.gator_timer = null;
			}

			if (v > 0) {
				if ((bpm = engine.getValue(g, 'bpm')) > 0) {
					var interval = parseInt(1000 / bpm * 60 / rate);
					self.gator_direction = false;
					self.gator_depth = depth;
					self.gator_timer = engine.beginTimer(interval, 'NovationLaunchpad.process_gator("' + g + '")');
				}
			}
			else {
				engine.setValue(group, 'filterHighKill', 0);
			}
		});
	},

	//
	// gator
	//

	process_gator: function(group) {
		var self = NovationLaunchpad;
		self.gator_direction = !self.gator_direction;
		engine.setValue(group, 'filterHighKill', self.gator_direction ? 1 : 0);
	},

	//
	// flanger button
	//

	flanger: function(name, page, group, depth, period, delay) {
		this.button(name, "all", page, 'hi_amber', 'lo_amber', group, "flanger", function(g, name, v) {
			if (v > 0) {
				engine.setValue("[Flanger]", "lfoDepth", depth);
				engine.setValue("[Flanger]", "lfoPeriod", period);
				engine.setValue("[Flanger]", "lfoDelay", delay);
			}
			engine.setValue(group, "flanger", v > 0 ? 1 : 0);
		});
	},

	loop: function(name, page, group, size) {
		this.button(name, "all", page, 'hi_yellow', 'lo_yellow', group, "", function(g, name, v) {
			if (v > 0) {
				engine.setValue(g, "beatloop_" + size + "_activate", 1);
			}
			else {
				if (engine.getValue(g, "beatloop_" + size + "_enabled")) {
					engine.setValue(g, "beatloop_" + size + "_toggle", 1);
				}
			}
		});
	},

	//
	// track scrolling
	//

	playlist: function(name, page, action) {
		this.button(name, "all", page, 'hi_yellow', 'lo_yellow', "[Playlist]", action, function(g, n, v) {
			var self = NovationLaunchpad;
			if (typeof(self.playlist_timer) != undefined && self.playlist_timer != null) {
				engine.stopTimer(self.playlist_timer);
				self.playlist_timer = null;
			}

			if (v > 0) {
				engine.setValue("[Playlist]", action, 1);
				self.playlist_timer = engine.beginTimer(this.shift > 0 ? 30 : 150, 'NovationLaunchpad.process_playlist("' + action + '")');
			}
		});
	},

	process_playlist: function(name) {
		engine.setValue("[Playlist]", name, 1);
	},

	//
	// map a callback to a launchpad button name
	//

	capture: function(name, values, page, func) {
		if (this.callbacks[name] == undefined) {
			this.callbacks[name] = [ [ values, page, func ] ];
		}
		else {
			this.callbacks[name].push([ values, page, func ]);
		}
	},

	//
	// send back to the launchpad for leds by name
	//

	send: function(name, value, page) {
		if (page == 0 || this.page == page) {
			if ((control = this.name2control[name]) != undefined) {
				if (this.cache[page][name] == value) return;
				midi.sendShortMsg(control[0], control[1], value);
			}
		}
		this.cache[page][name] = value;
	},

	//
	// hold button
	//

	button: function(name, values, page, on_color, off_color, group, event, callback) {

		// launchpad => mixxx

		this.capture(name, "all", page, function(g, name, value) {

			if (callback == undefined) {
				engine.setValue(group, event, value);
			}
			else if (typeof(callback) == "function") {
				if (values == "all" || (values == "press" && value > 0) || (values == "release" && value == 0)) {
					callback.call(this, group, event, value);
				}
			}

			if (values == "all" || (values == "press" && value > 0) || (values == "release" && value == 0)) {
				this.send(name, this.colors[value > 0 ? on_color : off_color], page);
			}
		});

		// mixxx => launchpad

		engine.connectControl(group, event, function(value, g, e) {
			this.send(name, this.colors[value > 0 ? on_color : off_color], page);
			this.feedback_cache[g + e] = value;
		});

		// init led

		this.send(name, this.colors[off_color], page);
	},

	//
	// toggle
	//

	toggle:  function(name, values, page, on_color, off_color, group, event, callback) {
		this.capture(name, "press", page, function(g, name, value) {
			if (typeof(this.toggle_cache[page][name]) == "undefined") {
				this.toggle_cache[page][name] = 0;
			}
			this.toggle_cache[page][name] = this.toggle_cache[page][name] == 0 ? 1 : 0;

			if (callback == undefined) {
				engine.setValue(group, event, this.toggle_cache[page][name]);
			}
			else if (typeof(callback) == "function") {
				callback.call(this, group, event, this.toggle_cache[page][name]);
			}

			this.send(name, this.colors[this.toggle_cache[page][name] > 0 ? on_color : off_color], page);
		});

		// mixxx => launchpad

		engine.connectControl(group, event, function(value, g, e) {
			this.send(name, this.colors[value > 0 ? on_color : off_color], page);
			this.toggle_cache[page][name] = value > 0 ? 1 : 0;
			this.feedback_cache[g + e] = value;
		});

		// init led

		this.send(name, this.colors[off_color], page);
	},

	//
	// hotcues
	//

	hotcue: function(name, page, group, num) {

		// launchpad => mixxx

		this.capture(name, "press", page, function(g, name, value) {
			if (this.shift2) {
				engine.setValue(group, "playposition", (num-1)/8);
			}
			else if (this.shift) {
				engine.setValue(group, "hotcue_" + num + "_clear", 1);
			}
			else {
				engine.setValue(group, "hotcue_" + num + "_activate", 1);
			}
		});

		// mixxx => launchpad

		engine.connectControl(group, "hotcue_" + num + "_enabled", function(value, g, e) {
			this.send(name, this.colors[value > 0 ? 'hi_red' : 'black'], page);
			this.feedback_cache[g + e] = value;
		});
	},

	//
	// jog
	//

	jog: function(name, page, group, dir) {
		this.button(name, "all", page, 'hi_orange', 'lo_orange', group, "", function(g, n, v) {

			if (dir == "fwd") {
				mult = 1;
				rate = "rate_temp_up";
			}
			else {
				mult = -1;
				rate = "rate_temp_down";
			}

			if (engine.getValue(g, "play") > 0) {
				if (this.shift > 0) {
					engine.setValue(g, rate, v > 0 ? 1 : 0);
				}
				else {
					engine.setValue(g, rate + "_small", v > 0 ? 1 : 0);
				}
			}
			else if (this.shift > 0) {
				if (v > 0) {
					engine.setValue(g, 'jog', 0.2 * mult);
				}
			}
			else engine.setValue(g, dir, v);
		});
	},

	//
	// turn a row of pads into a crossfader
	//

	cfader: function(y, x, page, nbtns, on_color, off_color, group, action) {
		var halfbtns = (nbtns-1)/2;

		// launchpad => mixxx

		for (var btn=0; btn<nbtns; btn++) {
			this.capture(y+","+(x+btn), "press", page, function(g, name, value) {
				var cap = name.match(/^\d+,(\d+)/); // value not closed
				var num = (cap[1]-halfbtns) / halfbtns;
				engine.setValue(group, action, num);
			});
			this.send(y+","+(x+btn), this.colors[on_color], page);
		}

		// mixxx => launchpad

		engine.connectControl(group, action, function(value, g, e) {
			for (btn=0; btn<(nbtns/2); btn++) {
				if ((value<0) && (value <= ((btn-halfbtns)/halfbtns))) {
					this.send(y+","+(x+btn), this.colors[on_color], page);
				}
				else {
					this.send(y+","+(x+btn), this.colors[off_color], page);
				}
			}
			for (btn=(nbtns/2); btn<nbtns; btn++) {
				if ((value>0) && (value >= ((btn-halfbtns)/halfbtns))) {
					this.send(y+","+(x+btn), this.colors[on_color], page);
				}
				else {
					this.send(y+","+(x+btn), this.colors[off_color], page);
				}
			}
			this.feedback_cache[g + e] = value;
		});
	},

	//
	// turn a column of pads into a virtual fader
	//

	vfader: function(y, x, page, nbtns, on_color, off_color, group, action) {
		var incr = 1 / (nbtns-1);

		// launchpad => mixxx

		for (var btn=0; btn<nbtns; btn++) {
			this.capture((y-btn)+","+x, "press", page, function(g, name, value) {
				var cap = name.match(/^(\d+),\d+/); // value not closed
				var num = y - cap[1];
				engine.setValue(group, action, incr * num);
			});
			this.send((y-btn)+","+x, this.colors[on_color], page);
		}

		// mixxx => launchpad

		engine.connectControl(group, action, function(value, g, e) {
			for (btn=0; btn<nbtns; btn++) {
				if (value >= btn*incr) {
					this.send((y-btn)+","+x, this.colors[on_color], page);
				}
				else {
					this.send((y-btn)+","+x, this.colors[off_color], page);
				}
			}
			this.feedback_cache[g + e] = value;
		});
	},

	//
	// turn a button into a beatblinker
	//

	beatblinker: function(name, page, on_color, off_color, group) {
		engine.connectControl(group, "VuMeter", function(value, g, e) {
			if (engine.getValue(g, "beat_active")){
				this.send(name, this.colors[on_color], page);
			}
			else {
				this.send(name, this.colors[off_color], page);
			}
		});
	},

	//
	// turn a column of pads into a vumeter
	//

	vumeter: function(y, x, page, nbtns, on_color, off_color, group, action) {
		var incr = 1 / nbtns;
		this.vumeters.push([ y, x, page, nbtns, on_color, off_color, group, action ]);
		engine.connectControl(group, action, function(value, g, e) {
			if (this.vumeter_shift > 0) {
				for (btn=0; btn<nbtns; btn++) {
					if (value > btn*incr) {
						this.send((y-btn)+","+x, this.colors[on_color], page);
					}
					else {
						this.send((y-btn)+","+x, this.colors[off_color], page);
					}
				}
			}
			this.feedback_cache[g + e] = value;
		});
	},

	vumeter_toggle: function(v) {
		this.vumeter_shift = v > 0 ? 1 : 0;

		//
		// clear fader leds when enabling vumeter and set back the leds for the volume if disabling
		//

		for (i in this.vumeters) {

			var value = this.vumeter_shift > 0 ? 0 : this.feedback_cache[ this.vumeters[i][6] + 'volume' ];

			if (value != undefined) {
				var y = this.vumeters[i][0];
				var x = this.vumeters[i][1];
				var page = this.vumeters[i][2];
				var nbtns = this.vumeters[i][3];
				var on_color = this.vumeters[i][4];
				var off_color = this.vumeters[i][5];
				var incr = 1 / nbtns;

				for (btn=0; btn<nbtns; btn++) {
					if (value > btn*incr) {
						this.send((y-btn)+","+x, this.colors[on_color], page);
					}
					else {
						this.send((y-btn)+","+x, this.colors[off_color], page);
					}
				}
			}
		}
	},

	//
	// get the last value sent to a launchpad led
	//

	get: function(name, page) {
		if (typeof(this.cache[page][name]) == undefined) {
			return 0;
		}
		else {
			return this.cache[page][name];
		}
	},

	//
	// set page
	//

	set_page: function(page) {
		if (page == this.page) return;

		var updates = {};
		var flashing = [];

		if ((this.cache[page]) && (this.cache[this.page])) {
			for (i in this.cache[page]) {
				if (this.cache[this.page][i] == undefined || this.cache[this.page][i] != this.cache[page][i]) {
					updates[i] = this.cache[page][i];
				}
			}
			for (i in this.cache[this.page]) {
				if (this.cache[page][i] == undefined) {
					updates[i] = 0x4; // black with copy bit set
				}
				else if (this.cache[this.page][i] != this.cache[page][i] && updates[i] == undefined) {
					updates[i] = this.cache[page][i];
				}
			}
		}

		// select buffer 1
		midi.sendShortMsg(0xb0, 0x0, 0x31);

		for (i in updates) {
			if ((control = this.name2control[i]) != undefined) {

				// 0 makes no sense - need 0x4 for black/off
				if (updates[i] == 0) {
					updates[i] = 0x4;
				}

				// send out non-flashing colors with copy bit removed
				if (updates[i] & 0x4) {
					midi.sendShortMsg(control[0], control[1], updates[i] & 0xfb);
				}
				else {
					// send out off for this buffer for a flashing color
					midi.sendShortMsg(control[0], control[1], 0x4);
					flashing.push([ control[0], control[1], updates[i] ]);
				}
			}
		}

		// select buffer 0
		midi.sendShortMsg(0xb0, 0x0, 0x34);

		// send out any flashing updates
		for (i in flashing) {
			midi.sendShortMsg(flashing[i][0], flashing[i][1], flashing[i][2]);
		}

		// re-enable internal buffer cycling for flashing colors
		midi.sendShortMsg(0xb0, 0x0, 0x28);

		this.page = page;
	},

	//
	// define colors
	//

	colors: function() {
		return {
			black: 4,

			lo_red: 1 + 4,
			mi_red: 2 + 4,
			hi_red: 3 + 4,
			lo_green: 16 + 4,
			mi_green: 32 + 4,
			hi_green: 48 + 4,
			lo_amber: 17 + 4,
			mi_amber: 34 + 4,
			hi_amber: 51 + 4,
			hi_orange: 35 + 4,
			lo_orange: 18 + 4,
			hi_yellow: 50 + 4,
			lo_yellow: 33 + 4,

			flash_lo_red: 1,
			flash_mi_red: 2,
			flash_hi_red: 3,
			flash_lo_green: 16,
			flash_mi_green: 32,
			flash_hi_green: 48,
			flash_lo_amber: 17,
			flash_mi_amber: 34,
			flash_hi_amber: 51,
			flash_hi_orange: 35,
			flash_lo_orange: 18,
			flash_hi_yellow: 50,
			flash_lo_yellow: 33
		}
	},

	//
	// define midi for all the buttons (as we can't define names in the xml or access that data here)
	// to create a 90 degree rotated mapping just redefine this list so "0,0" is still top left etc
	//

	buttons: function() {
		return {
			'up':      [ 'cc',   1, 0x68 ],
			'down':    [ 'cc',   1, 0x69 ],
			'left':    [ 'cc',   1, 0x6A ],
			'right':   [ 'cc',   1, 0x6B ],
			'session': [ 'cc',   1, 0x6C ],
			'user1':   [ 'cc',   1, 0x6D ],
			'user2':   [ 'cc',   1, 0x6E ],
			'mixer':   [ 'cc',   1, 0x6F ],
			'vol':     [ 'note', 1, 0x8 ],
			'pan':     [ 'note', 1, 0x18 ],
			'snda':    [ 'note', 1, 0x28 ],
			'sndb':    [ 'note', 1, 0x38 ],
			'stop':    [ 'note', 1, 0x48 ],
			'trkon':   [ 'note', 1, 0x58 ],
			'solo':    [ 'note', 1, 0x68 ],
			'arm':     [ 'note', 1, 0x78 ],
			'0,0':     [ 'note', 1, 0x00 ],
			'0,1':     [ 'note', 1, 0x01 ],
			'0,2':     [ 'note', 1, 0x02 ],
			'0,3':     [ 'note', 1, 0x03 ],
			'0,4':     [ 'note', 1, 0x04 ],
			'0,5':     [ 'note', 1, 0x05 ],
			'0,6':     [ 'note', 1, 0x06 ],
			'0,7':     [ 'note', 1, 0x07 ],
			'1,0':     [ 'note', 1, 0x10 ],
			'1,1':     [ 'note', 1, 0x11 ],
			'1,2':     [ 'note', 1, 0x12 ],
			'1,3':     [ 'note', 1, 0x13 ],
			'1,4':     [ 'note', 1, 0x14 ],
			'1,5':     [ 'note', 1, 0x15 ],
			'1,6':     [ 'note', 1, 0x16 ],
			'1,7':     [ 'note', 1, 0x17 ],
			'2,0':     [ 'note', 1, 0x20 ],
			'2,1':     [ 'note', 1, 0x21 ],
			'2,2':     [ 'note', 1, 0x22 ],
			'2,3':     [ 'note', 1, 0x23 ],
			'2,4':     [ 'note', 1, 0x24 ],
			'2,5':     [ 'note', 1, 0x25 ],
			'2,6':     [ 'note', 1, 0x26 ],
			'2,7':     [ 'note', 1, 0x27 ],
			'3,0':     [ 'note', 1, 0x30 ],
			'3,1':     [ 'note', 1, 0x31 ],
			'3,2':     [ 'note', 1, 0x32 ],
			'3,3':     [ 'note', 1, 0x33 ],
			'3,4':     [ 'note', 1, 0x34 ],
			'3,5':     [ 'note', 1, 0x35 ],
			'3,6':     [ 'note', 1, 0x36 ],
			'3,7':     [ 'note', 1, 0x37 ],
			'4,0':     [ 'note', 1, 0x40 ],
			'4,1':     [ 'note', 1, 0x41 ],
			'4,2':     [ 'note', 1, 0x42 ],
			'4,3':     [ 'note', 1, 0x43 ],
			'4,4':     [ 'note', 1, 0x44 ],
			'4,5':     [ 'note', 1, 0x45 ],
			'4,6':     [ 'note', 1, 0x46 ],
			'4,7':     [ 'note', 1, 0x47 ],
			'5,0':     [ 'note', 1, 0x50 ],
			'5,1':     [ 'note', 1, 0x51 ],
			'5,2':     [ 'note', 1, 0x52 ],
			'5,3':     [ 'note', 1, 0x53 ],
			'5,4':     [ 'note', 1, 0x54 ],
			'5,5':     [ 'note', 1, 0x55 ],
			'5,6':     [ 'note', 1, 0x56 ],
			'5,7':     [ 'note', 1, 0x57 ],
			'6,0':     [ 'note', 1, 0x60 ],
			'6,1':     [ 'note', 1, 0x61 ],
			'6,2':     [ 'note', 1, 0x62 ],
			'6,3':     [ 'note', 1, 0x63 ],
			'6,4':     [ 'note', 1, 0x64 ],
			'6,5':     [ 'note', 1, 0x65 ],
			'6,6':     [ 'note', 1, 0x66 ],
			'6,7':     [ 'note', 1, 0x67 ],
			'7,0':     [ 'note', 1, 0x70 ],
			'7,1':     [ 'note', 1, 0x71 ],
			'7,2':     [ 'note', 1, 0x72 ],
			'7,3':     [ 'note', 1, 0x73 ],
			'7,4':     [ 'note', 1, 0x74 ],
			'7,5':     [ 'note', 1, 0x75 ],
			'7,6':     [ 'note', 1, 0x76 ],
			'7,7':     [ 'note', 1, 0x77 ]
		};
	},

	// animate with shapesequence

	animateshapestimer: function(array, timer, page, on_color, off_color, direction, index, action) {
		this.showshape(array[index], page, on_color, off_color);
		engine.beginTimer(timer, function() {
			var self = NovationLaunchpad;
			var stop = false;
			index += direction;
			if (index<0) {
				index = array.length-1;
			}
			else if (index>=array.length) {
				index = 0;
				if (action=="stop") {
					stop = true;
				}
			}
			if ((!stop) && (!self.stopanimation)) {
				self.animateshapestimer(array, timer, page, on_color, off_color, direction, index, action);
			}
		}, true);
	},

	// show the next shape, can go reverse with negative direction

	nextshape: function(name, array, page, on_color, off_color, direction) {
		this.capture(name, "press", page, function(g, n, v) {
			this.testshapeindex += direction;
			if (this.testshapeindex<0) {
				this.testshapeindex = array.length-1;
			}
			else if (this.testshapeindex>=array.length) {
				this.testshapeindex = 0;
			}
			this.showshape(array[this.testshapeindex], page, on_color, off_color);
		});
	},

	// show a shape

	showshape: function(symbol, page, on_color, off_color) {
		if (this.shapes[symbol]) {
			var lo_color = 'lo_amber';
			if (on_color=='hi_red') { lo_color='lo_red'; }
			else if (on_color=='hi_green') { lo_color='lo_green'; }
			else if (on_color=='hi_orange') { lo_color='lo_orange'; }
			else if (on_color=='hi_yellow') { lo_color='lo_yellow'; }
			for (y=0; y<8; y++) {
				for (x=0; x<8; x++) {
					if (this.shapes[symbol][y][x]==1) {
						this.send(y+","+x, this.colors[on_color], page);
					}
					else if (this.shapes[symbol][y][x]==2) {
						this.send(y+","+x, this.colors[lo_color], page);
					}
					else {
						this.send(y+","+x, this.colors[off_color], page);
					}
				}
			}
		}
	},

	// shapes for visualization

	shapes: function() {
		return {
			lucky0: [
[0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0],
[0,0,0,0,1,0,0,0],
[0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0],
			],
			lucky1: [
[0,0,0,0,0,0,0,0],
[0,0,0,1,0,1,0,0],
[0,0,0,0,1,0,0,0],
[0,0,0,1,2,1,0,0],
[0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0],
			],
			lucky2: [
[0,0,0,0,0,1,0,0],
[0,0,1,1,0,1,0,0],
[0,0,0,0,1,0,0,0],
[0,0,0,1,2,1,1,0],
[0,0,0,1,2,0,0,0],
[0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0],
			],
			lucky3: [
[0,0,0,1,0,1,0,0],
[0,0,1,1,0,1,1,0],
[0,0,0,0,1,0,0,0],
[0,0,1,1,2,1,1,0],
[0,0,0,1,2,1,0,0],
[0,0,0,0,2,0,0,0],
[0,0,0,0,0,2,0,0],
[0,0,0,0,0,0,0,0],
			],
			star0: [
[0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0],
[0,0,0,0,1,0,0,0],
[0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0],
			],
			star1: [
[0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0],
[0,0,0,1,1,1,0,0],
[0,0,0,0,1,0,0,0],
[0,0,0,1,0,1,0,0],
[0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0],
			],
			star2: [
[0,0,0,0,0,0,0,0],
[0,0,0,0,1,0,0,0],
[0,0,1,1,1,1,1,0],
[0,0,0,1,1,1,0,0],
[0,0,0,1,1,1,0,0],
[0,0,1,0,0,0,1,0],
[0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0],
			],
			star3: [
[0,0,0,0,1,0,0,0],
[0,0,0,0,1,0,0,0],
[0,1,1,1,1,1,1,1],
[0,0,1,1,1,1,1,0],
[0,0,0,1,1,1,0,0],
[0,0,1,1,0,1,1,0],
[0,1,0,0,0,0,0,1],
[0,0,0,0,0,0,0,0],
			],
			heart0: [
[0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0],
[0,0,0,0,1,0,0,0],
[0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0]
			],
			heart1: [
[0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0],
[0,0,0,1,0,1,0,0],
[0,0,0,0,1,0,0,0],
[0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0]
			],
			heart2: [
[0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0],
[0,0,1,1,0,1,1,0],
[0,0,1,1,1,1,1,0],
[0,0,0,1,1,1,0,0],
[0,0,0,0,1,0,0,0],
[0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0]
			],
			heart3: [
[0,0,0,0,0,0,0,0],
[0,0,1,1,0,1,1,0],
[0,1,1,1,1,1,1,1],
[0,1,1,1,1,1,1,1],
[0,0,1,1,1,1,1,0],
[0,0,0,1,1,1,0,0],
[0,0,0,0,1,0,0,0],
[0,0,0,0,0,0,0,0]
			],
			heart4: [
[0,0,0,0,0,0,0,0],
[0,0,1,1,0,1,1,0],
[0,1,1,1,1,1,1,1],
[0,1,1,0,1,0,1,1],
[0,0,1,1,0,1,1,0],
[0,0,0,1,1,1,0,0],
[0,0,0,0,1,0,0,0],
[0,0,0,0,0,0,0,0]
			],
			heart5: [
[0,0,0,0,0,0,0,0],
[0,0,1,1,0,1,1,0],
[0,1,0,0,1,0,0,1],
[0,1,0,0,0,0,0,1],
[0,0,1,0,0,0,1,0],
[0,0,0,1,0,1,0,0],
[0,0,0,0,1,0,0,0],
[0,0,0,0,0,0,0,0]
			],
			heart6: [
[0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0],
[0,0,1,1,0,1,1,0],
[0,0,1,0,1,0,1,0],
[0,0,0,1,0,1,0,0],
[0,0,0,0,1,0,0,0],
[0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0]
			],
			a: [
[0,0,0,0,0,0,0,0],
[0,0,0,0,1,0,0,0],
[0,0,0,1,0,1,0,0],
[0,0,1,0,0,0,1,0],
[0,0,1,1,1,1,1,0],
[0,0,1,0,0,0,1,0],
[0,0,1,0,0,0,1,0],
[0,0,0,0,0,0,0,0]
			],
			b: [
[0,0,0,0,0,0,0,0],
[0,0,1,1,1,1,0,0],
[0,0,1,0,0,0,1,0],
[0,0,1,1,1,1,0,0],
[0,0,1,0,0,0,1,0],
[0,0,1,0,0,0,1,0],
[0,0,1,1,1,1,0,0],
[0,0,0,0,0,0,0,0]
			],
			c: [
[0,0,0,0,0,0,0,0],
[0,0,0,1,1,1,1,0],
[0,0,1,0,0,0,0,0],
[0,0,1,0,0,0,0,0],
[0,0,1,0,0,0,0,0],
[0,0,1,0,0,0,0,0],
[0,0,0,1,1,1,1,0],
[0,0,0,0,0,0,0,0]
			],
			d: [
[0,0,0,0,0,0,0,0],
[0,0,1,1,1,1,0,0],
[0,0,1,0,0,0,1,0],
[0,0,1,0,0,0,1,0],
[0,0,1,0,0,0,1,0],
[0,0,1,0,0,0,1,0],
[0,0,1,1,1,1,0,0],
[0,0,0,0,0,0,0,0]
			],
			e: [
[0,0,0,0,0,0,0,0],
[0,0,1,1,1,1,1,0],
[0,0,1,0,0,0,0,0],
[0,0,1,1,1,1,0,0],
[0,0,1,0,0,0,0,0],
[0,0,1,0,0,0,0,0],
[0,0,1,1,1,1,1,0],
[0,0,0,0,0,0,0,0]
			],
			f: [
[0,0,0,0,0,0,0,0],
[0,0,1,1,1,1,1,0],
[0,0,1,0,0,0,0,0],
[0,0,1,1,1,1,0,0],
[0,0,1,0,0,0,0,0],
[0,0,1,0,0,0,0,0],
[0,0,1,0,0,0,0,0],
[0,0,0,0,0,0,0,0]
			],
			g: [
[0,0,0,0,0,0,0,0],
[0,0,0,1,1,1,0,0],
[0,0,1,0,0,0,0,0],
[0,0,1,0,0,0,0,0],
[0,0,1,0,0,1,1,0],
[0,0,1,0,0,0,1,0],
[0,0,0,1,1,1,0,0],
[0,0,0,0,0,0,0,0]
			],
			h: [
[0,0,0,0,0,0,0,0],
[0,0,1,0,0,0,1,0],
[0,0,1,0,0,0,1,0],
[0,0,1,1,1,1,1,0],
[0,0,1,0,0,0,1,0],
[0,0,1,0,0,0,1,0],
[0,0,1,0,0,0,1,0],
[0,0,0,0,0,0,0,0]
			],
			i: [
[0,0,0,0,0,0,0,0],
[0,0,1,1,1,1,1,0],
[0,0,0,0,1,0,0,0],
[0,0,0,0,1,0,0,0],
[0,0,0,0,1,0,0,0],
[0,0,0,0,1,0,0,0],
[0,0,1,1,1,1,1,0],
[0,0,0,0,0,0,0,0]
			],
			j: [
[0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,1,0],
[0,0,0,0,0,0,1,0],
[0,0,0,0,0,0,1,0],
[0,0,0,0,0,0,1,0],
[0,0,1,0,0,0,1,0],
[0,0,0,1,1,1,0,0],
[0,0,0,0,0,0,0,0]
			],
			k: [
[0,0,0,0,0,0,0,0],
[0,0,1,0,0,0,1,0],
[0,0,1,0,0,1,0,0],
[0,0,1,0,1,0,0,0],
[0,0,1,1,1,0,0,0],
[0,0,1,0,0,1,0,0],
[0,0,1,0,0,0,1,0],
[0,0,0,0,0,0,0,0]
			],
			l: [
[0,0,0,0,0,0,0,0],
[0,0,1,0,0,0,0,0],
[0,0,1,0,0,0,0,0],
[0,0,1,0,0,0,0,0],
[0,0,1,0,0,0,0,0],
[0,0,1,0,0,0,0,0],
[0,0,1,1,1,1,1,0],
[0,0,0,0,0,0,0,0]
			],
			m: [
[0,0,0,0,0,0,0,0],
[0,0,1,0,0,0,1,0],
[0,0,1,1,0,1,1,0],
[0,0,1,0,1,0,1,0],
[0,0,1,0,0,0,1,0],
[0,0,1,0,0,0,1,0],
[0,0,1,0,0,0,1,0],
[0,0,0,0,0,0,0,0]
			],
			n: [
[0,0,0,0,0,0,0,0],
[0,0,1,0,0,0,1,0],
[0,0,1,1,0,0,1,0],
[0,0,1,1,1,0,1,0],
[0,0,1,0,1,1,1,0],
[0,0,1,0,0,1,1,0],
[0,0,1,0,0,0,1,0],
[0,0,0,0,0,0,0,0]
			],
			o: [
[0,0,0,0,0,0,0,0],
[0,0,0,1,1,1,0,0],
[0,0,1,0,0,0,1,0],
[0,0,1,0,0,0,1,0],
[0,0,1,0,0,0,1,0],
[0,0,1,0,0,0,1,0],
[0,0,0,1,1,1,0,0],
[0,0,0,0,0,0,0,0]
			],
			p: [
[0,0,0,0,0,0,0,0],
[0,0,1,1,1,1,0,0],
[0,0,1,0,0,0,1,0],
[0,0,1,0,0,0,1,0],
[0,0,1,1,1,1,0,0],
[0,0,1,0,0,0,0,0],
[0,0,1,0,0,0,0,0],
[0,0,0,0,0,0,0,0]
			],
			q: [
[0,0,0,0,0,0,0,0],
[0,0,0,1,1,1,0,0],
[0,0,1,0,0,0,1,0],
[0,0,1,0,0,0,1,0],
[0,0,1,0,1,0,1,0],
[0,0,1,0,0,1,0,0],
[0,0,0,1,1,0,1,0],
[0,0,0,0,0,0,0,0]
			],
			r: [
[0,0,0,0,0,0,0,0],
[0,0,1,1,1,1,0,0],
[0,0,1,0,0,0,1,0],
[0,0,1,0,0,0,1,0],
[0,0,1,1,1,1,0,0],
[0,0,1,0,0,1,0,0],
[0,0,1,0,0,0,1,0],
[0,0,0,0,0,0,0,0]
			],
			s: [
[0,0,0,0,0,0,0,0],
[0,0,0,1,1,1,0,0],
[0,0,1,0,0,0,0,0],
[0,0,0,1,1,1,0,0],
[0,0,0,0,0,0,1,0],
[0,0,1,0,0,0,1,0],
[0,0,0,1,1,1,0,0],
[0,0,0,0,0,0,0,0]
			],
			t: [
[0,0,0,0,0,0,0,0],
[0,0,1,1,1,1,1,0],
[0,0,0,0,1,0,0,0],
[0,0,0,0,1,0,0,0],
[0,0,0,0,1,0,0,0],
[0,0,0,0,1,0,0,0],
[0,0,0,0,1,0,0,0],
[0,0,0,0,0,0,0,0]
			],
			u: [
[0,0,0,0,0,0,0,0],
[0,0,1,0,0,0,1,0],
[0,0,1,0,0,0,1,0],
[0,0,1,0,0,0,1,0],
[0,0,1,0,0,0,1,0],
[0,0,1,0,0,0,1,0],
[0,0,1,1,1,1,1,0],
[0,0,0,0,0,0,0,0]
			],
			v: [
[0,0,0,0,0,0,0,0],
[0,0,1,0,0,0,1,0],
[0,0,1,0,0,0,1,0],
[0,0,1,0,0,0,1,0],
[0,0,1,0,0,0,1,0],
[0,0,0,1,0,1,0,0],
[0,0,0,0,1,0,0,0],
[0,0,0,0,0,0,0,0]
			],
			w: [
[0,0,0,0,0,0,0,0],
[0,0,1,0,0,0,1,0],
[0,0,1,0,0,0,1,0],
[0,0,1,0,0,0,1,0],
[0,0,1,0,1,0,1,0],
[0,0,1,1,0,1,1,0],
[0,0,1,0,0,0,1,0],
[0,0,0,0,0,0,0,0]
			],
			x: [
[0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0],
[0,0,1,0,0,0,1,0],
[0,0,0,1,0,1,0,0],
[0,0,0,0,1,0,0,0],
[0,0,0,1,0,1,0,0],
[0,0,1,0,0,0,1,0],
[0,0,0,0,0,0,0,0]
			],
			y: [
[0,0,0,0,0,0,0,0],
[0,0,1,0,0,0,1,0],
[0,0,0,1,0,1,0,0],
[0,0,0,0,1,0,0,0],
[0,0,0,0,1,0,0,0],
[0,0,0,0,1,0,0,0],
[0,0,0,0,1,0,0,0],
[0,0,0,0,0,0,0,0]
			],
			z: [
[0,0,0,0,0,0,0,0],
[0,0,1,1,1,1,1,0],
[0,0,0,0,0,1,0,0],
[0,0,0,0,1,0,0,0],
[0,0,0,1,0,0,0,0],
[0,0,1,0,0,0,0,0],
[0,0,1,1,1,1,1,0],
[0,0,0,0,0,0,0,0]
			],
			'=': [
[0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0],
[0,0,1,1,1,1,1,0],
[0,0,0,0,0,0,0,0],
[0,0,1,1,1,1,1,0],
[0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0]
			],
			'+': [
[0,0,0,0,0,0,0,0],
[0,0,0,0,1,0,0,0],
[0,0,0,0,1,0,0,0],
[0,0,1,1,1,1,1,0],
[0,0,0,0,1,0,0,0],
[0,0,0,0,1,0,0,0],
[0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0]
			],
			0: [
[0,0,0,1,1,1,0,0],
[0,0,1,0,0,0,1,0],
[0,0,1,0,0,0,1,0],
[0,0,1,0,0,0,1,0],
[0,0,1,0,0,0,1,0],
[0,0,1,0,0,0,1,0],
[0,0,1,0,0,0,1,0],
[0,0,0,1,1,1,0,0]
			],
			1: [
[0,0,0,0,1,0,0,0],
[0,0,0,1,1,0,0,0],
[0,0,0,0,1,0,0,0],
[0,0,0,0,1,0,0,0],
[0,0,0,0,1,0,0,0],
[0,0,0,0,1,0,0,0],
[0,0,0,0,1,0,0,0],
[0,0,0,1,1,1,0,0]
			],
			2: [
[0,0,0,1,1,1,0,0],
[0,0,1,0,0,0,1,0],
[0,0,0,0,0,0,1,0],
[0,0,0,0,0,1,0,0],
[0,0,0,0,1,0,0,0],
[0,0,0,1,0,0,0,0],
[0,0,1,0,0,0,0,0],
[0,0,1,1,1,1,1,0]
			],
			3: [
[0,0,0,1,1,1,0,0],
[0,0,1,0,0,0,1,0],
[0,0,0,0,0,0,1,0],
[0,0,0,0,1,1,0,0],
[0,0,0,0,0,0,1,0],
[0,0,0,0,0,0,1,0],
[0,0,1,0,0,0,1,0],
[0,0,0,1,1,1,0,0]
			],
			4: [
[0,0,0,0,0,1,0,0],
[0,0,0,0,1,1,0,0],
[0,0,0,1,0,1,0,0],
[0,0,0,1,0,1,0,0],
[0,0,1,0,0,1,0,0],
[0,0,1,1,1,1,1,0],
[0,0,0,0,0,1,0,0],
[0,0,0,0,0,1,0,0]
			],
			5: [
[0,0,1,1,1,1,1,0],
[0,0,1,0,0,0,0,0],
[0,0,1,0,0,0,0,0],
[0,0,1,1,1,1,0,0],
[0,0,0,0,0,0,1,0],
[0,0,0,0,0,0,1,0],
[0,0,1,0,0,0,1,0],
[0,0,0,1,1,1,0,0]
			],
			6: [
[0,0,0,0,0,1,0,0],
[0,0,0,0,1,0,0,0],
[0,0,0,1,0,0,0,0],
[0,0,1,1,1,1,0,0],
[0,0,1,0,0,0,1,0],
[0,0,1,0,0,0,1,0],
[0,0,1,0,0,0,1,0],
[0,0,0,1,1,1,0,0]
			],
			7: [
[0,0,1,1,1,1,1,0],
[0,0,0,0,0,0,1,0],
[0,0,0,0,0,1,0,0],
[0,0,0,0,0,1,0,0],
[0,0,0,0,1,0,0,0],
[0,0,0,0,1,0,0,0],
[0,0,0,1,0,0,0,0],
[0,0,0,1,0,0,0,0]
			],
			8: [
[0,0,0,1,1,1,0,0],
[0,0,1,0,0,0,1,0],
[0,0,1,0,0,0,1,0],
[0,0,0,1,1,1,0,0],
[0,0,1,0,0,0,1,0],
[0,0,1,0,0,0,1,0],
[0,0,1,0,0,0,1,0],
[0,0,0,1,1,1,0,0]
			],
			9: [
[0,0,0,1,1,1,0,0],
[0,0,1,0,0,0,1,0],
[0,0,1,0,0,0,1,0],
[0,0,1,0,0,0,1,0],
[0,0,0,1,1,1,1,0],
[0,0,0,0,0,1,0,0],
[0,0,0,0,1,0,0,0],
[0,0,0,1,0,0,0,0]
			],
			' ': [
[0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0],
[0,0,0,0,0,0,0,0]
			]
		};
	}
};
