// Matomo Tag Manager
tarteaucitron.services.matomotagmanager = {
	"key": "matomotagmanager",
	"type": "analytic",
	"name": "Matomo Tag Manager",
	"uri" : "https://fr.matomo.org/privacy/ ",
	"readmoreLink": "https://fr.matomo.org/faq/general/faq_146/",
	"needConsent": false,
	"cookies": ['_pk_ref', '_pk_cvar', '_pk_id', '_pk_ses', '_pk_hsr',
		'piwik_ignore', '_pk_uid', 'stg_last_interaction', 'stg_returning_visitor',
		'stg_traffic_source_priority'],
	"js": function () {
		"use strict";
		// When cookie allowed
		if (tarteaucitron.user.matomoTagManagerId === undefined) {
			return;
		}
		if (tarteaucitron.user.domainHost === undefined) {
			return;
		}
		var _mtm = _mtm || [];
		tarteaucitron.addScript('https://'+tarteaucitron.user.domainHost +
			'/js/container_'+tarteaucitron.user.matomoTagManagerId+'.js', function () {
			console.log('https://'+tarteaucitron.user.domainHost +'/js/container_'+tarteaucitron.user.matomoTagManagerId+'.js');
				var _mtm = _mtm || [];
				_mtm.push({'mtm.startTime': (new Date().getTime()), 'event':
					'mtm.Start'});
				var d=document, g=d.createElement('script'),
				s=d.getElementsByTagName('script')[0];
				g.type='text/javascript'; g.async=true; g.defer=true;
				g.src='https://'+domainHost+'/js/container_'+matomoTagManagerId+'.js';
				s.parentNode.insertBefore(g,s);
				document.write('<script src="' + url + '"></' + 'script>');
			});
		var interval = setInterval(function () {
			if (typeof Piwik === 'undefined') return
				clearInterval(interval)
			// make piwik/matomo cookie accessible by getting tracker
			Piwik.getTracker();
			// looping throught cookies
			var theCookies = document.cookie.split(';');
			for (var i = 1; i <= theCookies.length; i++) {
				var cookie = theCookies[i - 1].split('=');
				var cookieName = cookie[0].trim();
				// if cookie starts like a piwik one, register it
				if (cookieName.indexOf('_pk_') === 0) {
					tarteaucitron.services.matomotagmanager.cookies.push(cookieName
						);
				}
				if (cookieName.indexOf('stg_') === 0) {
					tarteaucitron.services.matomotagmanager.cookies.push(cookieName
						)
				}
			}
		}, 100)
	},
	"fallback": function () {
		"use strict";
		// When cookie denied
	}
};