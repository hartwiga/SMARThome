

var fhem = {
	// Module Name
  	name: 'fhem',
  	version: '0.0.1',
	
	// Object with default class/plugin parameters
  	params: {
  		debug: true,
  		sockets: [],
  		devicesOnPage: [],
  		currentPage: undefined,
  		enableDataChange: undefined,
  		disableSend: false,
  		blockingtime: 1000,
  		toast: true,
  	},

  install() {
    const Class = this;
    console.log('install', Class);
  },

	// Create callback, it will be executed in the very beginning of class initilization
   	create(instance) {
   		var app = this;
   		fhem.xhr.getCsrf();
    	console.log('create', instance);
  	},
	
  	static: {
  		fhem: {
  			url: undefined,
  			csrf: undefined,
  		},
  		setFhemUrl: function(url) {
    		Framework7.fhem.url = url;
    	},
  		getFhemUrl: function() {
    		return Framework7.fhem.url;
    	},
    	setFhemCsrf: function(csrf) {
    		Framework7.fhem.csrf = csrf;
    	},
  		getFhemCsrf: function() {
    		return Framework7.fhem.csrf;
    	},
  	},
	
	instance: {
	  	mappingMeteocons: {
	        't1': 'B',		
	        't2': 'H',		
	        't3': 'H',		
	        't4': 'N',		
	        't5': 'Y',		
	        't6': 'Q',		
	        't7': 'Q',		
	        't8': 'P',		
	        't9': 'U',		
	        't10': 'V',		
	        't11': 'W',		
	        't12': 'L',		
	        't13': 'F',		
	        't14': 'R',		
	        'na': '',		
	        'n1': 'C',		
	        'n2': 'I',		
	        'n3': 'I',		
	        'n4': 'N',		
	        'n5': 'Y',		
	        'n6': 'Q',		
	        'n7': 'Q',		
	        'n8': 'P',		
	        'n9': 'U',		
	        'n10': 'V',		
	        'n11': 'W',		
	        'n12': 'K',		
	        'n13': 'F',		
	        'n14': 'R',	
	    },
	},

	init: function() {
		var self = this;
		console.log('init', self);
	},

	on: {
	    init: function () {
	      	var self = this;
	      	console.log('on init',self);

	     	$$(window).on('beforeunload', function () {
	     		console.log(1, 'FHEM Plugin --> before cloese browser tab');
	     		fhem.socket.closeAlL();
		  	});

		  	$$(window).on('online', function () {
	   			console.log(1, 'FHEM Plugin --> online');
	   			fhem.socket.create();
		    });

		  	$$(window).on('offline', function () {
	   			console.log(1, 'FHEM Plugin --> offline');
	   			fhem.socket.closeAll();
		    });

	    },
	    pageBeforeIn: function (page) {
	    	var self = fhem;
	    	var params = self.params;

	    	fhem.params.enableDataChange = false; 

	    	params.currentPage = page;

	    	params.devicesOnPage = {};

	      	console.log(fhem.name + ': pageBeforeIn', page);

	     	var $el = page.$el.find('[data-type]');
	     	fhem.getDevicesOnPage($el);

	     	if(app.online && !params.sockets[page.name]) {
	     		fhem.xhr.dataRequest();

		        setTimeout(function () {

		            fhem.socket.create();
		        }, 2000);
	     	}

	     	app.on('fhemupdate', function(device, element) {
	     		fhem.data.handleDataUpdate(device, element);
    		});
	    },
	    pageAfterIn: function (page) {
	      console.log(fhem.name + ': pageAfterIn', page);
	      setTimeout( function() {
	      		console.log("FHEM command enable");
                fhem.params.enableDataChange = true; 
            }, 2000);
	      //console.log(fhem.params.devicesOnPage);
	    },
	    pageBeforeOut: function (page) {
	    	var self = fhem;
	    	var params = self.params;

	    	if(params.sockets[page.name])
	    		params.sockets[page.name].socket.close(1000, "pageChange");

	    	params.currentPage = undefined;

	    	app.off('fhemupdate');

	    	console.log(fhem.name + ': pageBeforeOut', page);
	    },
	    pageAfterOut: function (page) {
	      console.log(fhem.name + ': pageAfterOut', page);
	    },
	    pageInit: function (page) {
	      console.log(fhem.name + ': pageInit', page);
	    },
	    pageBeforeRemove: function (page) {
	      console.log(fhem.name + ': pageBeforeRemove', page);
	    },
    },

    log: function(topic, message) {
		console.log(2, new Date().getTime() +  ' ' + fhem.name + '-[' + topic + ']: ' + message); 
	},
	showToast: function(text) {
		if(fhem.params.toast) {
			app.toast.show({text: text});
		}
	},
    getDevicesOnPage: function(elements) {
		console.log('getDevicesOnPage', elements);
	 	elements.each(function(index, element) {
	      	var dataType = $$(element).data('type');
	      	var dataObject = $$(element).data('object');

	      	if(dataObject &&  dataObject.match(/f7/)) {
	      		//console.log("f7obj", $$(element).data('device'));
	      		fhem.data.handleTypeObject(element);
		    }
		    else if(dataType === 'weather') {
		    	fhem.data.addToDeviceList('device', element);
		    }
	      	//else if(dataType === 'html') {
	      	fhem.data.addToDeviceList('content', element);
	      	fhem.data.addToDeviceList('class', element);
	  		//}
	  	});
	},

	cmd: {
		validate: function(cmd) {
			return true;
		},
		send: function(cmd) {
			if(fhem.cmd.validate(cmd) && !fhem.params.disableSend) {
				fhem.showToast("Send command to FHEM: " + cmd);

				var url = Framework7.getFhemUrl();
				var csrf = Framework7.getFhemCsrf();

			    app.request.get(url,
			        {
			        	cmd: cmd,
			            fwcsrf: Framework7.getFhemCsrf(),
			            XHR: 1,
			        } , 
			        function(data, status, xhr) {
			        	fhem.xhr.receiveData(data)
			        },
			        function(xhr, status) {
			        	fhem.showToast("Error on send command to FHEM: " + status);
			            console.log(status);
			        }
		 	   	);
			}
		}
	},
	object: {
		f7Button: function(element) {
			element.on('touchstart mousedown', function(e) {
            	var element = $$(this);
            	e.preventDefault();
            	//e.stopImmediatePropagation();

            	fhem.data.change(element);
            });
       		element.on('touchend mouseup', function(e) {
            	var element = $$(this);
            	e.preventDefault();
            });
		},
		f7Link: function(element) {
			element.on('touchstart mousedown', function(e) {
            	var element = $$(this);
            	e.preventDefault();

            	fhem.data.change(element);
            });
      		element.on('touchend mouseup', function(e) {
            	var element = $$(this);
            	e.preventDefault();
            });
		},
		f7Picker: function(element) {
			var values = element.data("values");
            var displayValues = element.data("displayvalues");

            if(typeof values !== "undefined") {
                var confJson = '{"inputEl": "#' + element[0].id + '", "cols": [{"textAlign": "center","values": [' + values.split(",") + ']' + (typeof displayValues !== 'undefined' ? ',"displayValues": [' + displayValues.split(',') + ']' : '') + '}]}';
                var f7obj = app.picker.create(JSON.parse(confJson));
                element[0].f7Picker = f7obj;

                element.on('change', function() {
                    var element = $$(this);
                    fhem.data.change(element);
                });
            }
		},
		f7Calendar: function(element) {
			var confJson = '';
            var dateformat = element.data("dateformat");
            
            if(typeof dateformat === "undefined") {
                confJson = '{"inputEl": "#' + element[0].id + '"}';
            }
            else {
                confJson = '{"inputEl": "#' + element[0].id + '", "dateFormat":"' + dateformat + '", "footer":"true"}';
            }
                        
            var f7obj = app.calendar.create(JSON.parse(confJson));
            element[0].f7Calendar = f7obj;

            element.on('change', function() {
                var element = $$(this);
                fhem.data.change(element);
            });
		},
		f7Weather: function(element) {

		}
	},
	data: {
		addToDeviceList: function(type, element) {
			var device = $$(element).data(type);
      		
      		if(device && device !== undefined) {
      			var devicesOnPage = {};
      			var id = '';
	      		if(device.match(/:/)) {
      				var tmp = device.split(':');
      
      				devicesOnPage.device = tmp[0];
    				devicesOnPage.reading = tmp[1];
    				//devicesOnPage.isInternal = tmp[1] === 'STATE' ? true : false;

    				devicesOnPage.valid = false;
    				//id = (tmp[1] === 'STATE') ? tmp[0] : [tmp[0], tmp[1]].join('-');
    				id = [tmp[0], tmp[1]].join('-');
    			}
    			else {
    				var reading = $$(element).data('get');
    				if(reading && reading !== undefined) {
	    				devicesOnPage.device = device;
	    				devicesOnPage.reading = reading;
	    				//devicesOnPage.isInternal = reading === 'STATE' ? true : false;

	    				devicesOnPage.valid = false;
	    				id = [device, reading].join('-')
	    				//id = (reading === 'STATE') ? device : [device, reading].join('-');
    				}
    				else {
    					devicesOnPage.device = device;
	    				devicesOnPage.reading = 'STATE';
	    				//devicesOnPage.isInternal = reading === 'STATE' ? true : false;

	    				devicesOnPage.valid = false;
	    				id = [device, 'STATE'].join('-');
    				}
    			}

    			if(fhem.params.devicesOnPage[id] !== undefined) {
    				devicesOnPage.elements = fhem.params.devicesOnPage[id].elements;
    				devicesOnPage.elements.push(element);
    				fhem.params.devicesOnPage[id] = devicesOnPage;
    			}
    			else {
    				devicesOnPage.elements = [];
    				devicesOnPage.elements.push(element);
    				fhem.params.devicesOnPage[id] = devicesOnPage;
    			}
    		}
		},
		handleTypeObject: function(element) {
			var e = $$(element);

      		var f7objname = e.data('object');
        	var f7obj = eval("e[0]." + f7objname);

      		if ((typeof f7obj === "object") && (f7obj !== null)) {
                e.on('change', function() {
                    var e = $$(this);
                    fhem.data.change(element);
                });
            }
            else {
            	if(f7objname === 'f7Button') {
            		fhem.object.f7Button(e);
            	}
            	else if(f7objname === 'f7Link') {
            		fhem.object.f7Link(e);
            	}
            	else if(f7objname === 'f7Picker') {
            		fhem.object.f7Picker(e);
            	}
            	else if(f7objname === 'f7Calendar') {
            		fhem.object.f7Calendar(e);
            	}
	      	}

	      	fhem.data.addToDeviceList('device', element);

		},
		handleDataUpdate: function(device, element) {
			var e = $$(element);

			var dataType = e.data('type');
			var dataObject = e.data('object');
			var dataContent = e.data('content');
			var dataMapContent = e.data('map-content');
			var dataUnit = e.data('unit');
			var dataPostText = e.data('post-text');
			var dataClass = e.data('class');
			var dataMapClass= e.data('map-class');
			var dataMapChecked= e.data('map-checked');

			var valid = device.valid;
			var valueRaw = device.value;
			var value = valueRaw;

			if(dataType === 'weather') {
				var weatherIcon = e.find('.weather-icon');
				if(weatherIcon.length != 0) {
					e.empty();
				}

				e.addClass('weather');
				weatherIcon = $$('<div class="weather-icon meteocons"></div>');
				e.append(weatherIcon);

				var iconType = valueRaw.match('^https://www\.proplanta\.de/wetterdaten/images/symbole/([tn][0-9]+)\.gif');
                if(iconType) {
                	value = iconType[1];
                	//var dataMap = JSON.parse(instance.fhem.mappingMeteocons);
                	value = fhem.data.mapping(fhem.instance.mappingMeteocons, value, 'na');
					weatherIcon.attr('data-icon', value);
                }
			}
			else if(dataObject) {
				var o = eval("element." + dataObject);

				if(dataObject === 'f7Toggle') {
					if(dataMapChecked) {
						var dataMap = JSON.parse(dataMapChecked);
						value = fhem.data.mapping(dataMap, valueRaw, valueRaw);
					}
	                o.checked = value;
            	}
				else if(dataObject === 'f7Range') {
            		o.setValue(value);
            	}
            	else if(dataObject === 'f7Stepper') {
            		o.setValue(value);
            	}
            	else if(dataObject === 'f7Picker') {
            		o.setValue(new Array(value));
            	}
            	else if(dataObject === 'f7Calendar') {
            		o.setValue(new Array(value));
            	}
			}

			if(dataContent) {
				if(dataMapContent) {
					var dataMap = JSON.parse(dataMapContent);
					value = fhem.data.mapping(dataMap, valueRaw, valueRaw);
				}
				e.text(value);
				
				if(dataUnit) {
					e.append('<span>' + dataUnit + '</span>');
				}

				if(dataPostText) {
					e.append('<span>' + dataPostText + '</span>');
				}
			}
			else if(dataClass) {
				if(dataMapClass) {
					var dataMap = JSON.parse(dataMapClass);
					value = fhem.data.mapping(dataMap, valueRaw, valueRaw);

					for( var key in dataMap) {
						var c = dataMap[key];
						if(c && c !== "") {
							e.removeClass(c);
						}
					}
				}
				if(value && value !== "") 
					e.addClass(value);
			}		
		},
		mapping: function(o, v, d) {
	        if ((typeof o === 'object') && (o !== null)) {
	          for (var k in o) {
	            if (v === k || v.match(new RegExp('^' + k + '$'))) {
	              return o[k];
	            }
	          }
	        }
	        return d;
	    },
	    change: function(element) {
	    	var e = $$(element);

	    	if(!fhem.params.enableDataChange)
	    		return;

			var dataType = e.data('type');
			var dataObject = e.data('object');
			var dataMapChanged = e.data('map-changed');

			var dataDevice = e.data('device');
			if(dataDevice && dataDevice.match(/:/)) {
      			var tmp = device.split(':');
      			dataDevice = tmp[0];
      		}

			var dataCmd = e.data('cmd') ? e.data('cmd') : "set";
			var dataGet = e.data('get');
			var dataSet = e.data('set');
			var dataSet = ((dataSet !== 'STATE' && dataSet !== '') ? dataSet : dataSet !== 'STATE' ? dataSet :'');

			var dataFhemCmd =  e.data('fhem-cmd');
			var dataFhemCmdOn =  e.data('fhem-cmd-on');
			var dataFhemCmdOff =  e.data('fhem-cmd-off');

			var dataBlockingtime = e.data('blockingtime');
            dataBlockingtime = dataBlockingtime !== '' && typeof dataBlockingtime !== 'undefined' ? dataBlockingtime : fhem.params.blockingtime;
			
			var value = undefined;
			var cmd = undefined;

			if(dataObject) {
				var o = eval("element." + dataObject);

				if(dataObject === 'f7Toggle') {
					if(dataMapChanged) {
						var dataMap = JSON.parse(dataMapChanged);
						value = fhem.data.mapping(dataMap, o.checked.toString(), o.checked.toString());
					}
					cmd = dataCmd + " " + dataDevice + " " + value;
            	}
				else if(dataObject === 'f7Range') {
            		value = o.getValue();
            		cmd = [dataCmd,dataDevice,dataSet,value].join(' ');
            	}
            	else if(dataObject === 'f7Stepper') {
            		value = o.getValue();
            		cmd = [dataCmd,dataDevice,dataSet,value].join(' ');
            	}
            	else if(dataObject === 'f7Picker') {
            		value = o.getValue();
            		cmd = [dataCmd,dataDevice,dataSet,value].join(' ');
            	}
            	else if(dataObject === 'f7Calendar') {
            		value = element[0].value;
            		cmd = [dataCmd,dataDevice,dataSet,value].join(' ');
            	}
               	else if(dataObject === 'f7Button') {
            		if(dataFhemCmd) {
            			cmd = dataFhemCmd;
            		}
            	}
               	else if(dataObject === 'f7Link') {
            		if(dataFhemCmd) {
            			cmd = dataFhemCmd;
            			dataBlockingtime = 0;
            		}
            	}
			}

			if(cmd) {
				e.data('blocked', true);
				setTimeout(function (e) {
					e.removeData('blocked');
				}, dataBlockingtime, e);

				fhem.log('data.change -> send command to FHEM: ' + cmd);
				fhem.cmd.send(cmd);
			}
	    }
	},

	socket: {
		create: function() {

			var page = fhem.params.currentPage;

			fhem.params.sockets[page.name] = {};
			     		
			fhem.params.sockets[page.name].page = fhem.params.currentPage; 
			fhem.params.sockets[page.name].timestamp = new Date();	

			var wsUrl = Framework7.getFhemUrl().replace('http://', 'ws://') + '?XHR=1&inform=type=status;filter=' +
		        fhem.socket.requestFilter() + ';since=' + fhem.params.sockets[page.name].timestamp.getTime() + ';fmt=JSON' +
		        '&timestamp=' + Date.now();

		    fhem.log('socket url: ' + wsUrl);

			var socket = new WebSocket(wsUrl);

			socket.onopen = function(e) {
			  fhem.log('page -> ' + page.name, "socket established");
			};

			socket.onmessage = function(event) {
			  fhem.params.sockets[page.name].timestamp = new Date();
			  // log('page -> ' + page.name, "socket data received from server");
			  fhem.socket.receiveData(event.data);
			};

			socket.onclose = function(event) {
				fhem.socket.remove(page);
				fhem.log('page -> ' + page.name, " code=" + event.code);
				fhem.showToast("FHEM websocket closed: " + event.code);
			};

			socket.onerror = function(error) {
				fhem.log('page -> ' + page.name, "socket error ${error.message}");
				fhem.showToast("FHEM websocket error: " + error.message);
			};

			fhem.params.sockets[page.name].socket = socket;
		},
		remove: function(page) {
		    if(!fhem.params.sockets[page.name])
		    	return;

		    if(fhem.params.sockets[page.name].socket.readyState === WebSocket.CLOSED) {
		    	fhem.params.sockets[page.name].undefined;
		    	delete fhem.params.sockets[page.name];
		    }
		},
		closeAll: function() {
			if(!fhem.params.sockets)
		    	return;

		    for(var key in fhem.params.sockets) {
		    	//var socket = fhem.params.sockets[key].socket;
		    	if(fhem.params.sockets[key].socket.readyState === WebSocket.OPEN) {
		    		fhem.params.sockets[key].socket.close(1000, "closeAll");
		    	}
		    	else if(fhem.params.sockets[key].socket.readyState === WebSocket.CONNECTING) {
		    		fhem.params.sockets[key].socket.close(1000, "closeAll");
					socket.onopen = function (e) {
		    		  e.target.close();
		            };
		    	}
		    	else if(fhem.params.sockets[key].socket.readyState === WebSocket.CLOSED) {
		    		fhem.params.sockets[key].socket = undefined;
		    		delete fhem.params.sockets[key];
		    	}
		    }
		},
		requestFilter: function() {
			var devices = [];
			var readings = [];
			var filter = undefined;

			for (var key in fhem.params.devicesOnPage) {
				devices.push(fhem.params.devicesOnPage[key].device);
				if(key.match(/./)) {
					readings.push(fhem.params.devicesOnPage[key].reading);
				}
				else {
					readings.push('STATE');
				}
			}
			
			if(devices.length && readings.length) {
		    	filter = devices.join(',') + ', ' + readings.join(' ');
			}

			return filter;
		},
		receiveData: function(data) {
			if(data) {
			    var lines = data.split(/\n/);

			    for (var i = 0; i < lines.length; i++) {
			      	var lastChar = lines[i].slice(-1);

			      	if (lastChar === ']') {
			        	var element = JSON.parse(lines[i]);

			          	var id = element[0];
			          	var value = element[1];
			          	var isSTATE = (element[1] !== element[2]);
			          	var isTrigger = (element[1] === '' && element[2] === '');
			          	var element = fhem.params.devicesOnPage[id];

			          	if(element && element.value !== value) {
			          		fhem.log('socket -> ' + id, "data received from server valueNew=" + value + " valueAlt=" + element.value);
		    				element.value = value;
		    				element.valid = true;
		    				element.timestamp = new Date().getTime();

		    				for(var key in element.elements) {
		    					var e = element.elements[key];
		    					var blocked = $$(e).data('blocked');

		    					if(!blocked && element.valid) {
		    						app.emit('fhemupdate', element, e);
		    					}
		    					else {
		    						fhem.log('socket -> ' + id, 'data update blocked');
		    					}
		    				}
		    			}
			        }
			    }
			}
		},
	},
	xhr: {
        getCsrf: function() {
        	var csrf = undefined;
        	var url = Framework7.getFhemUrl() + '?XHR=1&_=1590999690524';

            Framework7.request.get(url,
                function(data, status, xhr) {
                    var csrf = xhr.getResponseHeader('X-FHEM-csrfToken');
                    Framework7.setFhemCsrf(csrf);
                    console.log('FHEM -> got csrf token: ', csrf);
                },
                function(xhr, status) {
                    console.log(status);
                    fhem.showToast("FHEM error on get csrf token: " + status);
                }
            );

            
        },
		dataRequest: function() {
			var cmdLine = fhem.xhr.dataRequestFilter();
			var url = Framework7.getFhemUrl();
			var csrf = Framework7.getFhemCsrf();

			if(csrf && csrf !== undefined) {
			    app.request.json(url,
			        {
			        	cmd: cmdLine,
			            fwcsrf: Framework7.getFhemCsrf(),
			            XHR: 1,
			        } , 
			        function(data, status, xhr) {
			        	fhem.xhr.receiveData(data)
			        },
			        function(xhr, status) {
			            console.log(status);
			            fhem.showToast("FHEM xhr request error: " + status);
			        }
			    );
			}
			else {
				console.log('ERROR CSRF !!!');
				setTimeout(function () {
		            fhem.xhr.dataRequest();
		        }, 500);
			}
		},
		dataRequestFilter: function() {
			var devices = [];
			var readings = [];
			var filter = undefined;

			for (var key in fhem.params.devicesOnPage) {
				devices.push(fhem.params.devicesOnPage[key].device);
				if(key.match(/-/)) {
					readings.push(fhem.params.devicesOnPage[key].reading);
				}
				else {
					readings.push('STATE');
				}
			}
			
			if(devices.length && readings.length) {
		    	filter = 'jsonlist2' + ' ' + devices.join(',') + ' ' + readings.join(' ');
			}

			return filter;
		},
		receiveData: function(data) {
		    if(data && data.Results) {
		    	console.log('XHR data -> ', data);
		    	for (var i = 0; i < data.Results.length; i++) {

		    		var device = data.Results[i].Name;

		    		for (var reading in data.Results[i].Readings) {
		    			var id = [device, reading].join('-');
		    			var element = fhem.params.devicesOnPage[id];

		    			if(element && element.value !== data.Results[i].Readings[reading].Value) {

		    				element.value = data.Results[i].Readings[reading].Value;
		    				element.valid = true;
		    				element.timestamp = new Date().getTime();

		    				for(var key in element.elements) {
		    					if(element.valid) {
		    						var e = element.elements[key];
		    						var blocked = $$(e).data('blocked');

			    					if(!blocked && element.valid) {
			    						app.emit('fhemupdate', element, e);
			    					}
		    					}
		    				}
			    		}
		    		}

		    		for (var internal in data.Results[i].Internals) {
		    			var id = [device, internal].join('-');
		    			var element = fhem.params.devicesOnPage[id];

		    			if(element && element.value !== data.Results[i].Internals[internal]) {

		    				element.value = data.Results[i].Internals[internal];
		    				element.valid = true;
		    				element.timestamp = new Date().getTime();

		    				for(var key in element.elements) {
		    					if(element.valid) {
		    						var e = element.elements[key];
		    						var blocked = $$(e).data('blocked');

			    					if(!blocked && element.valid) {
			    						app.emit('fhemupdate', element, e);
			    					}

		    					}
		    				}
			    		}
		    		}
		    	}
		    }
		},
	},
};

var fhemtoogle = {
	// Module Name
  	name: 'fhemtoogle',
	
	// Object with default class/plugin parameters
  	params: {
  	},

  install() {
    const Class = this;
    console.log(Class);

  },

	// Create callback, it will be executed in the very beginning of class initilization
   	create(instance) {
   		var app = this;

    	console.log('create', instance);

    	app.fhem = Framework7.ConstructorMethods({
	      defaultSelector: '.fhemtoogle',
	      constructor: fhemtoogle,
	      app,
	      domProp: 'fhemtoogle',
	    });
  	},
	
  	static: {
    	fhem,
  	},
	
	init: function() {
		var app = this;
		console.log('init', app);
	},

	on: {
	    init: function () {
	      var self = this;
	      console.log('app init: ' + self.name);
	    },
    },
};

var myPlugin = {
  // Module Name
  name: 'demo-module',
  /* Install callback
  It will be executed right after component is installed
  Context of this callback points to Class where it was installed
  */
  install() {
    const Class = this;
    console.log(Class);

  },
  /* Create callback
  It will be executed in the very beginning of class initilization (when we create new instance of the class)
  */
  create(instance) {
    console.log('init', instance);
  },
  /*
  Object with default class/plugin parameters
  */
  params: {
    myPlugin: {
      a: 1,
      b: 2,
      c: 3,
    }
  },
  /* proto object extends Class prototype */
  proto: {
    demo() {
      return 'demo-module-proto-method';
    },
    demoStatic: 'demo-module-proto-static',
  },
  // Extend Class with static props and methods, e.g. Class.myMethod
  static: {
    demo() {
      return 'demo-module-class-method';
    },
    demoStatic: 'demo-module-class-static',
  },
  /* Initialized instance Props & Methods */
  instance: {
  	myPlugin: {
	    demoProp: true,
	    demoMethod() {
	      return myPlugin.demo();
	    },
	}
  },
  /* Event handlers */
  on: {
    demoEvent(a, b) {
      console.log('demo-event', a, b);
    },
  },
  /* Handle clicks */
  clicks: {
    // prop name means CSS selector of element to add click handler
    'p': function ($clickedEl, data) {
      // $clickedEl: Dom7 instance of clicked element
      // data: element data set (data- attributes)
    },
  }
};