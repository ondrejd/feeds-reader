/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var self = require('sdk/self');
var { Cc, Ci, Cu } = require('chrome');
//var { setTimeout, clearTimeout } = require('sdk/timers');
var { ToggleButton } = require('sdk/ui/button/toggle');
var { Panel } = require('sdk/panel');

// Our libraries
var storage = require('lib/storage');
var utils = require('lib/utils');

Cu.import('resource://gre/modules/Task.jsm');

/**
 * @type {Object} Add-on's preferences.
 */
const ADDON_PREFS = require('sdk/simple-prefs').prefs;

/**
 * @type {String} Add-on's name taken from `package.json`.
 */
const ADDON_NAME = require('./package.json').name;

/** 
 * @type {String} Add-on's title taken from `package.json`.
 */
const ADDON_TITLE = require('./package.json').title;

/**
 * Add-on's main toolbar button.
 * @var {ToggleButton} gToolbarButton
 */
var gToolbarButton = ToggleButton({
	badge: '*',
	badgeColor: utils.getThemeColor(),
	disabled: true,
	icon: {
		'16': self.data.url('icon16.png'),
		'32': self.data.url('icon32.png'),
		'64': self.data.url('icon64.png')
	},
	id: ADDON_NAME + '-button',
	label: ADDON_TITLE,
	onChange: handleToolbarButton
});

/**
 * Add-on's panel attached to the toolbar button.
 * @var {Panel} gToolbarPanel
 */
var gToolbarPanel = Panel({
	contentURL: self.data.url('panel/index.html'),
	contentScriptFile: self.data.url('panel/index.js'),
	contentStyleFile: self.data.url('panel/index.css'),
	/**
	 * Called when panel is shown.
	 */
	onShow: function () {
		gToolbarPanel.port.emit('show', ADDON_PREFS.contentStyle);
	},
	/**
	 * Called when panel is hiding - switching checked of the main toolbar button.
	 */
	onHide: function () {
		gToolbarPanel.port.emit('hide');
		gToolbarButton.state('window', { checked: false });
	}
});

/**
 * Handles click on main toolbar button.
 * @param {Object} aState
 */
function handleToolbarButton(aState) {
	if (aState.checked === true) {
		gToolbarPanel.show({ position: gToolbarButton });
	}
} // end handleToolbarButton(aState)

/**
 * Listener for change value of `contentStyle` preference.
 */
function onContentStylePrefChange() {
	gToolbarButton.badgeColor = utils.getThemeColor();
	gToolbarPanel.port.emit('style', ADDON_PREFS.contentStyle);
} // end onContentStylePrefChange()

// Listens to preferences values changes.
require('sdk/simple-prefs').on('contentStyle', onContentStylePrefChange);

/**
 * Update toolbarbutton's badge with current count of unread items.
 * @param {Number} aCount
 */
function updateBadgeWithUnreadItems(aCount) {
	let cnt = parseInt(gToolbarButton.badge) + aCount;

	if (cnt == 0) {
		gToolbarButton.label = "Feeds Reader\nThere are no unread items!";
	} else if (cnt == 1) {
		gToolbarButton.label = "Feeds Reader\nThere is one unread item!";
	} else {
		gToolbarButton.label = "Feeds Reader\nThere is " . aCount + " unread items!";
	}
 
	gToolbarButton.badge = cnt;
	gToolbarButton.disabled = false;
} // end updateBadgeWithUnreadItems(aCount)

// ==========================================================================

/**
 * Fetch unread items for all feeds.
 * @param {Array} aFeeds
 */
function fetchUnreadItems(aFeeds) {
	aFeeds.forEach(function (aFeed) {
		utils.fetchFeed(aFeed.XmlUrl).then(
			/**
			 * Called on successfully fetched feed.
			 * @param {String} aResponse
			 */
			function (aResponse) {
				utils.parseFeed(aFeed.XmlUrl, aResponse);
			},
			/**
			 * Called when fetching feed failed.
			 * @param {String} aStatusText
			 */
			function (aStatusText) {
				console.log('FAILURE', aStatus);
			}
		);
	});
} // end fetchUnreadItems(aFeeds)

/**
 * Fetch feeds from our database.
 */
function fetchFeeds() {
	gToolbarButton.badge = '-';
	gToolbarButton.label = "Feeds Reader\nFetching unread items.";

	storage.getFeeds().then(
		function (aFeeds) {
			console.log('Fetched feeds: ' + aFeeds.length);

			if (aFeeds.length === 0) {
				gToolbarButton.badge = '0';
				gToolbarButton.label = "Feeds Reader\nThere are no feeds.";
				return;
			}

			// Start fetching unread items
			fetchUnreadItems(aFeeds);

			gToolbarButton.disabled = false;
		},
		function (aError) {
			console.log(aError);
		}
	);
} // end fetchFeeds()

// ==========================================================================
// Start our add-on

// Check storage version
storage.getStorageVersion().then(
	function (aVersion) {
		if (aVersion >= 1) {
			// Note: We have nothing to do here...
			return;
		}

		// Database schema needs to be created.
		storage.createSchema().then(
			function (aResult) {
				if (aResult !== true) {
					gToolbarButton.badge = '!';
					gToolbarButton.label = "Feeds Reader\nERROR: Database schema not created!";
					return;
				}

				fetchFeeds();
			}
		);
	},
	function (aError) {
		// Note: There is possible only one error - open connection failed.
		gToolbarButton.badge = '!';
		gToolbarButton.label = "Feeds Reader\nERROR: Database is not available!";
	}
);

// ==========================================================================
// Exported by JPM:
// a dummy function, to show how tests work.
// to see how to test this function, look at test/test-index.js
//function dummy(text, callback) {
//	callback(text);
//}
//
//exports.dummy = dummy;
