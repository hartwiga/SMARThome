/* FTUI Plugin
 */

/* global ftui:true, Modul_widget:true */

"use strict";

function depends_html() {
    var deps = [];
    return deps;
}

// ToDo: data-lock as reading
/* Example
    <input type="checkbox" data-type="html"
           data-checked="dummy2:STATE" data-map-checked='{"on":"true", "off":"false"}'
           data-changed="dummy2:STATE" data-map-changed='{"true":"on", "false":"off"}'>
*/

var Modul_f7 = function() {

    var enable_send = false;

    var timer_f7Range;
    var timer_f7Picker;
    var timer_f7Stepper;
    var timer_f7Calendar;
    var timer_f7Toggle;

    function map(mapObj, val, defaultVal) {
        if ((typeof mapObj === 'object') && (mapObj !== null)) {
          for (var key in mapObj) {
            if (val === key || val.match(new RegExp('^' + key + '$'))) {
              return mapObj[key];
            }
          }
        }
        return defaultVal;
    }


    function mapping2f7(data, elem, val) {
        var converted = new String(val);
        var m = elem.data(data); 

        converted = map(m, converted, converted);
        console.log(1, new Date().getTime() + ' f7-[' + elem.data('object') + ']: do mapping from ftui to f7 (value from: ' + val + ' to: ' + converted + ')');

        return converted;
    }

    function mapping2ftui(data, elem, val) {
        var converted = new String(val);;
        var m = elem.data(data); 

        converted = map(m, converted, converted);
        console.log(1, new Date().getTime() +  ' f7-[' + elem.data('object') + ']: do mapping from f7 to ftui (value from: ' + val + ' to: ' + converted + ')');

        return converted;
    }

    function onClicked(elem) {

        if(elem.hasClass("button-active")) {
            return;
        }

        elem.addClass("active-state");
        setTimeout(function () {
            elem.removeClass("active-state");
        }, 500);

        if (elem.isValidData('url')) {
            document.location.href = elem.data('url');
        } else if (elem.isValidData('url-xhr')) {
            ftui.toast(elem.data('url-xhr'));
            $.get(elem.data('url-xhr'));
        } else if (elem.isValidData('fhem-cmd')) {
            ftui.toast(elem.data('fhem-cmd'));
            ftui.setFhemStatus(elem.data('fhem-cmd'));
        } else if (elem.isValidData('clicked')) {

            var value = '';
            var map = elem.data('map-clicked');

            if ((typeof map === "object") && (map !== null)) {
                var len = Object.keys(map).length;
                value = map[Object.keys(map)[0]];
                for (var i = 0; i < len; i++) {
                    if (elem.hasClass(Object.keys(map)[i])) {
                        if (i + 1 == len) {
                            value = map[Object.keys(map)[0]];
                        } else {
                            value = map[Object.keys(map)[i + 1]];
                        }
                        break;
                    }
                }
            }
            elem.data('value', value);
            changed(elem);
        }
    }

    function send(elem) {
        var direct_cmd = '';

        var device = elem.data('device');
        var reading = elem.data('set');

        var f7objname = elem.data('object');
        var f7obj = eval("elem[0]." + f7objname);

        if (f7objname == 'f7Stepper' || f7objname == 'f7Range' || f7objname == 'f7Picker') {
            elem.data('value', f7obj.value);
        }
        else if (f7objname == 'f7Calendar') {
            elem.data('value', elem[0].value);
        }
        else if (f7objname == 'f7Toggle') {
            var converted = mapping2ftui('map-changed', elem, f7obj.checked);
            elem.data('value', converted);
            if (elem.isValidData('fhem-cmd-on') && elem.isValidData('fhem-cmd-off')) {
                if (f7obj.checked) {
                    direct_cmd = elem.data('fhem-cmd-on');
                } 
                else {
                    direct_cmd = elem.data('fhem-cmd-off');
                }
            }
            
        }

        elem.data('f7change_flag',{state: true, timestamp: new Date().getTime()});

        if (enable_send) {
            if(direct_cmd === '') {
                console.log(1, new Date().getTime() + ' send-[' + elem.data('object') + ']: ' + elem.data('device') + ' value: ' + elem.data('value'));

                if (ftui.isValid(device) && ftui.isValid(reading)) {
                    elem.data('set', (reading === 'STATE') ? '' : reading);
                    elem.data('device', device);
                }

                elem.transmitCommand();   
            }
            else {
                console.log(1, new Date().getTime() + ' send-[' + elem.data('object') + ']: ' + direct_cmd);
                ftui.setFhemStatus(direct_cmd);
            }
        }
    }

    function changed(elem) {
        console.log(1, new Date().getTime() + ' changed-[' + elem.data('object') + ']: ' + elem.data('device'));
        send(elem); 
    }


    function init() {

        me.elements = $('[data-type="' + me.widgetname + '"]:not([data-ready])', me.area);

        me.elements.each(function(index) {

            var elem = $(this);
            elem.attr("data-ready", "");

            elem.initData('val', elem.data('value')); // value is reserved for widget intern usage, therefore we switch to val
            elem.initData('value', elem.val());
            elem.initData('get', 'STATE');
            var get = elem.data('get');
            var set = elem.data('set');
            elem.initData('set', (set !== 'STATE' && set !== '') ? set : get !== 'STATE' ? get :'');
            elem.initData('cmd', (set !== 'STATE' && set !== '' && typeof set !== 'undefined') ? 'set' : 'set');
            elem.initData('get-on', '(true|1|on|open|ON)');
            elem.initData('get-off', '!on');

            var timeout = elem.data('timeout');
            elem.initData('timeout', timeout !== '' && typeof timeout !== 'undefined' ? timeout : 2000);


            if (elem.isValidData('f7update_flag')) {
               elem.removeData('f7update_flag');
            }

            if (elem.isValidData('lock')) {
                elem.initData('lock-on', '(true|1|on)');
            }
            elem.initData('lock', elem.data('get'));
            if (elem.isValidData('lock-on')) {
                elem.initData('lock-off', '!on');
            }
            me.addReading(elem, 'lock');
            if (elem.isDeviceReading('lock-on')) {
                me.addReading(elem, 'lock-on');
            }
            if (elem.isDeviceReading('lock-off')) {
                me.addReading(elem, 'lock-off');
            }

            me.addReading(elem, 'get');
            if (elem.isDeviceReading('get-on')) {
              me.addReading(elem, 'get-on');
            }
            if (elem.isDeviceReading('get-off')) {
              me.addReading(elem, 'get-off');
            }

            if (elem.isDeviceReading('class')) {
                me.addReading(elem, 'class');
            }

            var f7objname = elem.data('object');
            var f7obj = eval("elem[0]." + f7objname);

            elem.initData('f7object', f7obj);

            console.log(1, new Date().getTime() + ' f7: init f7 element: ' + f7objname + ' connected to ' + elem.data('device'));

            if ((typeof f7obj === "object") && (f7obj !== null)) {
                elem.on('change', function() {
                    var elem = $(this);
                    changed(elem); 
                });
            }
            else {
                /*
                if(f7objname === 'f7Link') {
                    elem.click(function(e) {
                        var elem = $(this);
                        onClicked(elem);
                    });
                }
                */
                if(f7objname === 'f7Button' || f7objname === 'f7Link') {
                    elem.on(ftui.config.clickEventType, function (e) {
                        var elem = $(this);
                        //e.preventDefault();
                        e.stopImmediatePropagation();
                        elem.data('touch_pos_y', $(window).scrollTop());
                        elem.data('touch_pos_x', $(window).scrollLeft());

                        onClicked(elem);
                    });
                    
                    //elem.on(ftui.config.releaseEventType, function (e) {
                    elem.on(ftui.config.releaseEventType, function (e) {
                        var elem = $(this);
                        e.preventDefault();
                        e.stopImmediatePropagation();
                        //ftui.toast(elem.data('touch_pos_y'));
                        if (Math.abs(elem.data('touch_pos_y') - $(window).scrollTop()) > 3 ||
                            (Math.abs(elem.data('touch_pos_x') - $(window).scrollLeft()) > 3)) return;

                        onClicked(elem);

                    });
                }

                if(f7objname === 'f7Picker') {
                    var values = elem.data("values");
                    var displayValues = elem.data("displayvalues");

                    if(typeof values !== "undefined") {
                        var confJson = '{"inputEl": "#' + elem[0].id + '", "cols": [{"textAlign": "center","values": [' + values.split(",") + ']' + (typeof displayValues !== 'undefined' ? ',"displayValues": [' + displayValues.split(',') + ']' : '') + '}]}';
                        var f7obj = f7.ftui.picker.create(JSON.parse(confJson));
                        elem[0].f7Picker = f7obj;
                        elem.on('change', function() {
                            var elem = $(this);
                            changed(elem); 
                        });
                    }
                }
                 if(f7objname === 'f7Calendar') {
                    var confJson = '';
                    var dateformat = elem.data("dateformat");
                    if(typeof dateformat === "undefined") {
                        confJson = '{"inputEl": "#' + elem[0].id + '"}';
                    }
                    else {
                        confJson = '{"inputEl": "#' + elem[0].id + '", "dateFormat":"' + dateformat + '", "footer":"true"}';
                    }
                        
                        var f7obj = f7.ftui.calendar.create(JSON.parse(confJson));
                        elem[0].f7Calendar = f7obj;
                        elem.on('change', function() {
                            var elem = $(this);
                            changed(elem); 
                        });
                  
                }
            }

        });


        f7.ftui.$(document).on('ftuiInitWidgetsDone', function () {
          console.log('f7 - ftuiInitWidgetsDone');
          if(f7.ftui.dialog) {
            setTimeout(function () {
              f7.ftui.dialog.close();
              enable_send = true;
              console.log(1, new Date().getTime() + ' changes - enabled');
              //notification.open();
            }, 1000);  
          }
        });

    }

    function update(dev, par) {
        me.elements.each(function (index) {
            var elem = $(this);
            var t = enable_send === false ? 0 : elem.data('timeout');

            $.each(['get', 'get-on', 'get-off', 'class'], function (idx, key) {
                if(key === 'get' || key === 'get-off' || key === 'get-on') {
                    if (elem.matchDeviceReading(key, dev, par)) {
                        var value = elem.getReading('get').val;
              
                        var f7objname = elem.data('object');
                        var f7obj = eval("elem[0]." + f7objname);

                        var changed_by_ui = false; 
                        if(elem.isValidData('f7change_flag')) {
                            
                            var last_change_by_ui = elem.data('f7change_flag').timestamp;
                            if(elem.data('f7change_flag').state && (new Date().getTime() - last_change_by_ui) < 1000) {
                                changed_by_ui = elem.data('f7change_flag').state;
                            }
                        }
                        
                        console.log(1, new Date().getTime() + ' update-[' + elem.data('object') + ']: ' + elem.data('device') + ' = ' + value );

                        if (typeof value === "undefined" || typeof f7obj === "undefined") {

                        }
                        else {  
                            if(!changed_by_ui) {
                                if(f7obj.value != value) {
                                    if(elem.isValidData('timer')) {
                                        var timer = elem.data('timer');
                                        clearTimeout(timer);
                                    }

                                    elem.data('timer', setTimeout(function(){ 
                                        if (f7objname == 'f7Range' || f7objname == 'f7Stepper') {  
                                            console.log("Value: " + value);
                                            f7obj.setValue(value);
                                        }
                                        else if(f7objname == 'f7Picker' || f7objname == 'f7Calendar') {
                                            f7obj.setValue(new Array(value));
                                        }
                                        if (f7objname == 'f7Toggle') {
                                            var c = mapping2f7('map-checked', elem, value);
                                            if(f7obj.checked != c) {
                                                f7obj.checked = c;
                                            }
                                        }
                                    }, t));
                                }
                            }
                            else {
                                if(f7obj.value == value) {
                                    elem.removeData('f7change_flag');
                                }
                            }
                        }
                    }
                }
                
                if(key === 'class') {
                    //reading for class
                    if (elem.matchDeviceReading(key, dev, par)) {
                        var read = '';
                        var paraname = elem.data('class');

                        if ($.isArray(paraname)) {
                            for (var i = 0, len = paraname.length; i < len; i++) {
                                read = read + elem.getReading('class', i).val;
                            }
                        } else {
                            read = elem.getReading('class').val;
                        }
                        if (ftui.isValid(read)) {
                            var map = elem.data('map-class');
                            if ((typeof map === "object") && (map !== null)) {
                                $.each(map, function (key, value) {
                                    //if(map.hasOwnProperty(read) && value !== '')
                                    if(value != '')
                                        elem.removeClass(value);
                                });
                                elem.addClass(map[read]);
                            }
                        }
                    }      
                }
                

            });

            me.updateLock(elem, dev, par);

        });
    }

    var me = $.extend(new Modul_widget(), {

        widgetname: 'f7',
        init: init,
        update: update,
    });

    return me;
};