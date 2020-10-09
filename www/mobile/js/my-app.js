// -------- Framework7---------


// https://framework7.io/docs/
var $$ = Dom7;

Template7.global = {
    os: 'iOS',
    browser: 'Chrome',
    username: 'johndoe',
    email: 'john@doe.com'
};

Framework7.use(fhem);
Framework7.setFhemUrl(config.fhemconnector.url);

var app = new Framework7({
    // componentUrl: './pages/template_app.html',
    // App root element
    root: '#app',
    // App Name
    name: 'SMARThome',
    // App id
    id: 'de.hartwiga.smarthome',
    //App version
    version: '1.0.27',
    // theme
    theme: 'auto',
    // Enable swipe panel
    panel: {
        swipe: 'left',
    },
    // Navbar
    navbar: {
        hideOnPageScroll: true,
        iosCenterTitle: true,
    },
    // Statusbar
    statusbar: {
        iosOverlaysWebView: true,
    },
    popup: {
        closeOnEscape: true,
        swipeToClose: true,
    },
    dialog: {
        destroyPredefinedDialogs: true,
    },

    toast: {
        position: 'bottom',
        closeTimeout: 3000,
        destroyOnClose: true,
    },
            // Routes
    routes: [

    ],
    // My plugins
    //fhemPlugin: true,
    on: {
        init: function() {
            console.log('--> APP init');
            /*
            console.log('--> APP init');
            var $ = this.$;
            console.log('this.$: ' + this.$);
            var app = this.$app;
            console.log('this.$app: ') + this.$app;
            var self = this;
            console.log('this: ' + this);
            var router = this.$router;
            console.log('this.$router: ' + this.$router);
            */
            
        },
        connection: function(isOnline) {
            if (isOnline) {
                console.log('APP --> online');
            } else {
                console.log('APP --> offline');
            }
        },
        isdark: function(isDark) {
            if (isDark) {
                console.log('APP --> darkmode theme activated');
            } else {
                console.log('APP --> lightmode theme activated');
            }
        },
        formStoreData: function(form, data) {},
    },
    // Data section
    data: function() {
        return {
            userDataTemplate: {
                name: '',
                username: '',
                password: '',
                darkmode: [],
                autologin: [],
                message: {
                    timestamp: Math.floor(new Date().getTime()/1000),
                    newMessages: [], 
                }
            },
            token: undefined,
            userlist: config.app.userlist,
            message: {
                status: false,
                getmsg_url: Framework7.getFhemUrl() + '?cmd=get messages json',
                setmsg_delete: Framework7.getFhemUrl() + '?cmd=set messages delete',
                cycletime: 5000
            },
            fhem: {
            },
            survialanceStation: {
                sid: '',
            }
        };
    },
    methods: {
        sort: function(data) {
            return data.sort(function(a, b) {
                var i = parseInt(b.timestamp);
                var j = parseInt(a.timestamp);
                
                if (i < j) {
                    return -1;
                }
                if (i > j) {
                    return 1;
                }
                return 0;
            });
        },
        fhemGetCsrf: function() {
            app.request.get(app.data.fhem.csrf_url, 
                function(data, status, xhr) {
                    app.data.fhem.csrf = xhr.getResponseHeader('X-FHEM-csrfToken');
                    console.log('FHEM -> got csrf token: ' + app.data.fhem.csrf);
                },
                function(xhr, status) {
                    console.log(status);
                    console.log(xhr);
                }
            );
        },
        checkUserDataStructure(obj){

            if(!obj.hasOwnProperty('name'))
                return false;

            if(!obj.hasOwnProperty('username'))
                return false;
            
            if(!obj.hasOwnProperty('password'))
                return false;
            
            if(!obj.hasOwnProperty('darkmode'))
                return false;
            
            if(!obj.hasOwnProperty('autologin'))
                return false;

            if(!obj.message.hasOwnProperty('timestamp'))
                return false;

            if(!obj.message.hasOwnProperty('newMessages'))
                return false;

            return true;
        },
        formatMessageTimestamp: function(itemTime) {

            var diff = Math.floor((new Date().getTime() - new Date(itemTime * 1000)) / 1000);

            if(diff < 10) {
                return "jetzt";
            }
            else if (diff < 60) {
                return "vor " + diff + " Sekunden";
            } else if (Math.floor(diff / 60) < 60) {
                return "vor " + Math.floor(diff / 60) + " Minuten";
            } else if (Math.floor(diff / 60 / 60) < 24) {
                return "vor " + Math.floor(diff / 60 / 60) + " Stunden";
            } else if (Math.floor(diff / 60 / 60 / 24) == 1) {
                return "gestern";
            } else if (Math.floor(diff / 60 / 60 / 24) == 2) {
                return str = "vorgestern";
            } else if (Math.floor(diff / 60 / 60 / 24) >= 3) {
                return new Date(itemTime).toLocaleDateString('de-DE', { weekday: "long" });
            }
        },
        getMessageTimestamp: function() {
            var c = app.form.getFormData("config");
            if(c !== undefined ) {
                return c.message.timestamp;
            }
            else {
                return undefined;
            } 
        },
        saveMessageTimestamp: function(timestamp) {
            var c = app.form.getFormData("config");
            c.message.timestamp = timestamp;

            app.form.storeFormData("config", c);
        },
        saveNewMessages: function(msglist) {
            var messagesArray = [];

            var c = app.form.getFormData("config");

            messagesArray = c.message.newMessages;
            for (i in msglist) {
                messagesArray.push(msglist[i]);
            }
            c.message.newMessages = messagesArray;

            app.form.storeFormData("config", c);
        },
        deleteNewMessage: function(s) {
            var messagesArray = [];

            var c = app.form.getFormData("config");
            messagesArray = c.message.newMessages;

            if(s !== 'all') {
                for (i in messagesArray) {
                    if(messagesArray[i] !== null && messagesArray[i].uuid === s) {
                        delete messagesArray[i];
                        break;
                    }
                }
            }
            else {
                messagesArray = [];
            }

            c.message.newMessages = messagesArray;

            app.form.storeFormData("config", c);
        },
        showMessage: function(msg) {
            var self = this;

            msg.datetime = new Date(msg.timestamp * 1000).toLocaleString('de-DE',{dateStyle: "full", timeStyle: "medium"});
            if(msg.priority == 0){
                msg.priotext = ''
            }
            else if(msg.priority == 1){
                msg.priotext = 'Normale Priorität';
            }
            else if(msg.priority == 2) {
                msg.priotext = 'Hohe Priorität';
            }
            else {
               msg.priotext = '';
            }

            if(msg.parameter != null) {
                msg.parameter.url = '<p><a href="' + msg.parameter.url + '" class="link external">' + msg.parameter.url_title + '</a></p>';
            }
            else {
                msg.parameter = {url: ''};
            }

            var dynamicPopup = app.popup.create({
                content:  '<div class="popup popup-handler-new-messages">'+
                            '<div class="page">' +
                                '<div class="swipe-handler"></div>' +
                                '<div class="page-content">' +
                                    '<div class="block-title block-title-large">' + msg.title + '</div>' +
                                    '<div class="block block-strong">'+      
                                        '<div class="block-header">' +
                                            '<div>' + msg.datetime + '</div>' +
                                            '<div>' + msg.priotext + '</div>' +
                                        '</div>' +
                                        '<p>' + msg.text + '</p>'+
                                        msg.parameter.url +
                                    '</div>'+
                                '</div>'+
                            '</div>'+
                        '</div>',
            });

            var obj = app.notification.create({
                msgid: msg.uuid,
                icon: '<i class="icon icon-app"></i>',
                titleRightText: app.methods.formatMessageTimestamp(msg.timestamp),
                title: app.name,
                subtitle: msg.title,
                text: msg.text,
                closeButton: false,
                closeOnClick: true,
                closeTimeout: 3000,
                on: {
                    closed: function (e) {     
                        // Create dynamic Popup
                        //dynamicPopup.open();
                        //console.log('--> showMessage: Message closed'); 
                        //app.methods.deleteNewMessage(e.params.msgid); 
                        //app.methods.showMessageBadge();              
                    },
                },
            });
            obj.open();

            return obj;
        },
        showMessageBadge: function() {
            var messagesArray = [];
            var cnt = 0;

            var c = app.form.getFormData("config");
            if(c.hasOwnProperty('message') && c.message.hasOwnProperty('newMessages')) {
                messagesArray = c.message.newMessages;
            }

            for (i in messagesArray) {
                if(messagesArray[i] !== null) {
                    cnt++;
                }
            }

            $$('.navbar #messages.icon span.badge').remove();

            if(cnt > 0) {
                $$('.navbar #messages.icon').prepend('<span class="badge color-red">' + cnt + '</span>');
            }
        },
        getAllNewMessages: function() {
            var messagesArray = [];

            var c = app.form.getFormData("config");

            if(c.hasOwnProperty('message') && c.message.hasOwnProperty('newMessages')) {
                messagesArray = c.message.newMessages;
            }

            return messagesArray;
        },
        isMessageNew: function(uuid) {
            var messagesArray = [];

            var c = app.form.getFormData("config");
            if(c.hasOwnProperty('message') && c.message.hasOwnProperty('newMessages')) {
                messagesArray = c.message.newMessages;
            }

            for (i in messagesArray) {
                if(messagesArray[i] !== null && messagesArray[i].uuid === uuid) {
                    return true;
                }
            }
            return false;
        },
        messageLongPoll: function(timestamp) {
            var url = app.data.message.getmsg_url + ' ' + app.data.token.user + ' since ' + timestamp;

            app.request.json(url,
                {
                    fwcsrf: Framework7.getFhemCsrf(),
                    XHR: 1,
                } , 
                function(data, status, xhr) {
                    //console.log(new Date().getTime() +  ' : XHR --> message polling');
                    var oMsg = data;
                    //console.log(oMsg);

                    var cnt = oMsg.messages.length;
                    //console.log('--> messageLongPoll: ' + cnt + ' message(s)');
                    if(cnt > 0) {

                        $$('.navbar #messages.icon').prepend('<span class="badge color-red">' + cnt + '</span>');

                        app.methods.saveNewMessages(oMsg.messages);
                        var msgno = undefined;
                        for (var i in oMsg.messages) {
                            msgno = i;
                            // Convert timestamp to human readable string
                            //var t = oMsg.messages[i].timestamp * 1000;
                            //oMsg.messages[i].datetime = app.methods.formatMessageTimestamp(t);

                            // Add standard app name as title if not exist 
                            // if (oMsg.messages[i].title == "") {
                            //     oMsg.messages[i].title = app.name;
                            // }
                        }                            
                    }

                    //Show newest message
                    if(msgno !== undefined) {
                        var obj = app.methods.showMessage(oMsg.messages[msgno]);
                        $$(window).trigger('newmessage', oMsg.messages[msgno]);
                    }

                    app.methods.showMessageBadge();

                    // Remember last message poll time
                    var timestamp = Math.floor(new Date().getTime() / 1000);
                    app.methods.saveMessageTimestamp(timestamp);

                    app.data.message.status = true;

                    // Call polling again
                    setTimeout(function() {app.methods.messageLongPoll(timestamp)}, app.data.message.cycletime);
                },
                function(xhr, status) {
                    console.log(status);
                }
            );
        },
        survialanceStationLogin: function() {
            var url = config.surveillancestation.url + '/webapi/auth.cgi';
            var data = {
                api: 'SYNO.API.Auth',
                version: 2,
                method: 'Login',
                session: 'SurveillanceStation',
                account: config.surveillancestation.user,
                passwd: config.surveillancestation.password,
            };

            app.request.json(url, data,
                function(data, status, xhr) {
                    console.log(data);

                    var d = data.data;
                    app.data.survialanceStation.sid = d.sid;
                },
                function(xhr, status) {
                    console.log(status);
                    console.log(xhr);
                }
            );
        }
    }
});

var mainView = app.views.create('.view-main', {
    url: '/',
    routes: [{
            name: 'home',
            path: '/',
            componentUrl: './pages/template_home.html',
            beforeEnter: function(routeTo, routeFrom, resolve, reject) {
                var app = this.app;
                var self = this;

                if (app.data.token === undefined) {
                    app.data.token = { loggedin: false, user: '', role: '', name: '' };
                }

                var token = app.data.token;
                if (token.loggedin) {

                    // Login survialance station
                    app.methods.survialanceStationLogin();

                    // Start message polling cycle
                    if(!app.data.message.status) {
                        console.log('beforeEnter page home --> message polling start');
                        var timestamp = app.methods.getMessageTimestamp();
                        setTimeout(function() {app.methods.messageLongPoll(timestamp)}, app.data.message.cycletime);
                    }

                    resolve();
                } else {

                    var c = app.form.getFormData("config");
                    if (c !== undefined && app.methods.checkUserDataStructure(c)) {
                        if ($$('html').hasClass('theme-dark') != true && ((c !== undefined) && c.darkmode[0]) == 'yes') {
                            $$('html').addClass('theme-dark');
                        }

                        if (c.autologin[0] != undefined && c.autologin[0] == 'yes') {
                            var user = app.data.userlist[c.username]
                            if (user !== null && user !== undefined) {
                                if (user.pw === c.password) {
                                    app.data.token.loggedin = true;
                                    app.data.token.user = c.username;
                                    app.data.token.role = user.role;
                                    app.data.token.name = user.name;

                                    // Login survialance station
                                    app.methods.survialanceStationLogin();

                                    // Start message polling
                                    if(!app.data.message.status) {
                                        var timestamp = app.methods.getMessageTimestamp();
                                        setTimeout(function() {app.methods.messageLongPoll(timestamp)}, app.data.message.cycletime);
                                    }
                                    resolve();
                                }
                                else {
                                    reject();
                                    var view = this.view;
                                    view.router.navigate('/login/', { animate: false });
                                }
                            }
                        } 
                        else {
                            reject();
                            var view = this.view;
                            view.router.navigate('/login/', { animate: false });
                        }
                    } 
                    else {

                        //console.log('Init user data to: ' + JSON.stringify(app.data.userDataTemplate));
                        app.form.removeFormData("config");

                        app.form.storeFormData("config", app.data.userDataTemplate);
                        app.form.convertToData("#config", app.data.userDataTemplate);

                        reject();
                        var view = this.view;
                        view.router.navigate('/login/', { animate: false });
                    }
                }
            },
            keepAlive: true,
        },
        {
            name: 'login',
            path: '/login/',
            componentUrl: './pages/template_login.html',
        },
        {
            name: 'logout',
            path: '/logout/',
            async: function(routeTo, routeFrom, resolve, reject) {
                //var d = app.data.userDataTemplate;
                //var t = { loggedin: false, user: '', role: '', name: '' };

                //app.data.token = t;
                app.data.token.loggedin = false;

                var c = app.form.getFormData("config");
                if (c !== undefined) {
                    c.autologin = [];
                    c.password = '';
                }

                //console.log('User data: ' + JSON.stringify(d));
                app.form.storeFormData("config", c);

                reject();
                var view = this.view;
                view.router.navigate('/login/', { animate: false });
            }
        },
        {
            name: 'panel-left',
            path: '/panel-left/',
            panel: {
                componentUrl: './pages/template_left_panel.html',
            }
        },
        {
            name: 'livingroom',
            path: '/livingroom/',
            componentUrl: './pages/template_livingroom.html',
            beforeEnter: [checkAuth, checkPermissionUser],
        },
        {
            name: 'office',
            path: '/office/',
            componentUrl: './pages/template_office.html',
            beforeEnter: [checkAuth, checkPermissionUser],
        },
        {
            name: 'kidsroom',
            path: '/kidsroom/',
            componentUrl: './pages/template_kidsroom.html',
            beforeEnter: [checkAuth, checkPermissionUser],
        },
        {
            name: 'bedroom',
            path: '/bedroom/',
            componentUrl: './pages/template_bedroom.html',
            beforeEnter: [checkAuth, checkPermissionUser],
        },
        {
            name: 'atticroom',
            path: '/atticroom/',
            componentUrl: './pages/template_atticroom.html',
            beforeEnter: [checkAuth, checkPermissionUser],
        },
        {
            name: 'toiletroom',
            path: '/toiletroom/',
            componentUrl: './pages/template_toiletroom.html',
            beforeEnter: [checkAuth, checkPermissionUser],
        },
        {
            name: 'kitchen',
            path: '/kitchen/',
            componentUrl: './pages/template_kitchen.html',
            beforeEnter: [checkAuth, checkPermissionUser],
        },
        {
            name: 'corridor',
            path: '/corridor/',
            componentUrl: './pages/template_corridor.html',
            beforeEnter: [checkAuth, checkPermissionUser],
        },
        {
            name: 'basement',
            path: '/basement/',
            componentUrl: './pages/template_basement.html',
            beforeEnter: [checkAuth, checkPermissionUser],
        },
        {
            name: 'stairwell',
            path: '/stairwell/',
            componentUrl: './pages/template_stairwell.html',
            beforeEnter: [checkAuth, checkPermissionUser],
        },
        {
            name: 'playroom',
            path: '/playroom/',
            componentUrl: './pages/template_playroom.html',
            beforeEnter: [checkAuth, checkPermissionUser],
        },
        {
            name: 'entrance',
            path: '/entrance/',
            componentUrl: './pages/template_entrance.html',
            beforeEnter: [checkAuth, checkPermissionUser],
        },
        {
            name: 'carport',
            path: '/carport/',
            componentUrl: './pages/template_carport.html',
            beforeEnter: [checkAuth, checkPermissionUser],
        },
        {
            name: 'terrace',
            path: '/terrace/',
            componentUrl: './pages/template_terrace.html',
            beforeEnter: [checkAuth, checkPermissionUser],
        },
        {
            name: 'bathroom',
            path: '/bathroom/',
            componentUrl: './pages/template_bathroom.html',
            beforeEnter: [checkAuth, checkPermissionUser],
        },
        {
            name: 'residents',
            path: '/residents/',
            componentUrl: './pages/detail_residents.html',
            beforeEnter: [checkAuth, checkPermissionAdmin],
        },
        {
            name: 'window',
            path: '/window/',
            componentUrl: './pages/detail_windows.html',
            beforeEnter: [checkAuth, checkPermissionUser],
        },
        {
            name: 'lights',
            path: '/lights/',
            componentUrl: './pages/detail_lights.html',
            beforeEnter: [checkAuth, checkPermissionUser],
        },
        {
            name: 'weather',
            path: '/weather/',
            componentUrl: './pages/detail_weather.html',
            beforeEnter: [checkAuth, checkPermissionUser],
        },
        {
            name: 'mower',
            path: '/mower/',
            componentUrl: './pages/detail_mower.html',
            beforeEnter: [checkAuth, checkPermissionAdmin],
        },
        {
            name: 'shutters',
            path: '/shutters/',
            componentUrl: './pages/detail_shutters.html',
            beforeEnter: [checkAuth, checkPermissionAdmin],
        },
        {
            name: 'network',
            path: '/network/',
            componentUrl: './pages/detail_network.html',
            beforeEnter: [checkAuth, checkPermissionUser],
        },
        {
            name: 'alarmsystem',
            path: '/alarmsystem/',
            componentUrl: './pages/detail_alarmsystem.html',
            beforeEnter: [checkAuth, checkPermissionUser],
        },
        {
            name: 'cams',
            path: '/cams/',
            componentUrl: './pages/detail_cams.html',
            beforeEnter: [checkAuth, checkPermissionUser],
        },
        {
            name: 'waste',
            path: '/waste/',
            componentUrl: './pages/detail_waste.html',
            beforeEnter: [checkAuth, checkPermissionUser],
        },
        {
            name: 'heating',
            path: '/heating/',
            componentUrl: './pages/detail_heating.html',
            beforeEnter: [checkAuth, checkPermissionAdmin],
        },
        {
            name: 'config',
            path: '/config/',
            componentUrl: './pages/details_config.html',
            beforeEnter: [checkAuth, checkPermissionUser],
        },
        {
            name: 'messages',
            path: '/messages/',
            componentUrl: './pages/template_messages.html',
            beforeEnter: [checkAuth, checkPermissionUser],
        },
        {
            name: 'msg',
            path: '/msg/:msguuid/',
            componentUrl: './pages/template_message.html',
            beforeEnter: [checkAuth, checkPermissionUser],
        },
        {
            name: 'epg',
            path: '/epg/',
            componentUrl: './pages/template_epg.html',
            beforeEnter: [checkAuth, checkPermissionUser],
        },
        {
            name: 'about',
            path: '/about/',
            componentUrl: './pages/template_about.html',
            beforeEnter: [checkAuth, checkPermissionUser],
        },
        {
            path: '(.*)',
            url: './pages/404.html',
        }
    ],
});

function checkAuth(to, from, resolve, reject) {
    var isLoogedIn = this.app.data.token.loggedin;
    if (isLoogedIn) {
        resolve();
    } else {
        reject();
    }
}

function checkPermissionUser(to, from, resolve, reject) {
    var role = this.app.data.token.role;
    var allowed = role == 'user' || role == 'admin' ? true : false;
    if (allowed) {
        resolve();
    } else {
        reject();
    }
}

function checkPermissionAdmin(to, from, resolve, reject) {
    var role = this.app.data.token.role;
    var allowed = role == 'admin' ? true : false;
    if (allowed) {
        resolve();
    } else {
        reject();
    }
}