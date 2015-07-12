/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Contains all necessary functions for working with Feeds Reader SQLite storage.
 */

var { XMLHttpRequest } = require('sdk/net/xhr');
var windows = require('sdk/windows').browserWindows;

/**
 * Simple function that returns main color for the used theme.
 * @returns {String}
 * @see https://www.google.com/design/spec/style/color.html#color-color-palette
 */
function Utils_GetThemeColor() {
	let style = require('sdk/simple-prefs').prefs.contentStyle;

	switch (style) {
		case 'red'        : return '#F44336'; break;
		case 'pink'       : return '#E91E63'; break;
		case 'purple'     : return '#9C27B0'; break;
		case 'deep-purple': return '#673AB7'; break;
		case 'indigo'     : return '#3F51B5'; break;
		case 'blue'       : return '#2196F3'; break;
		case 'light-blue' : return '#03A9F4'; break;
		case 'cyan'       : return '#00BCD4'; break;
		case 'teal'       : return '#009688'; break;
		case 'green'      : return '#4CAF50'; break;
		case 'light-green': return '#8BC34A'; break;
		case 'lime'       : return '#CDDC39'; break;
		case 'yellow'     : return '#FFEB3B'; break;
		case 'amber'      : return '#FFC107'; break;
		case 'orange'     : return '#FF9800'; break;
		case 'deep-orange': return '#FF5722'; break;
		case 'brown'      : return '#795548'; break;
		case 'gray'       : return '#9E9E9E'; break;
		case 'blue-gray'  : return '#607D8B'; break;
	}

	return style;
} // end Utils_GetThemeColor()

/**
 * Fetch unread items for the given feed.
 * @param {String} aUrl
 * @returns {Promise}
 */
function Utils_FetchFeed(aUrl) {
	let promise = new Promise(function (resolve, reject) {
		console.log('Fetching feed: "' + aUrl + '"!');

		var req = new XMLHttpRequest();
		req.open('GET', aUrl);
		req.send();
		req.onload = function () {
			if (this.status == 200) {
				resolve(this.response);
			} else {
				reject(this.statusText);
			}
		};
		req.onerror = function () {
			reject(this.statusText);
		};
	});

	return promise;
} // end Utils_FetchFeed(aUrl)

/**
 * Listener for our feed parser.
 */
function FeedParserResultListener() {}
FeedParserResultListener.prototype = {
	handleResult: function(aResult) {
		var feed = aResult.doc;
		feed.QueryInterface(Ci.nsIFeed);

		// Open a new window and set a listener for "open" event.
		windows.open({
			url: 'about:blank',
			onOpen: function(window) {
				//var win = window.open('', 'FeedTest_Window');
				var doc = window.document.wrappedJSObject;
				console.log(doc);
				doc.open();
		
				// Write the HTML header and page title
				doc.write('<html><head><title>Feed: ' + feed.title.text + '</title></head><body>');
				doc.write('<h1>' + feed.title.text + '</h1><p>');
		
				var itemArray = feed.items;
				var numItems = itemArray.length;
		
				// Write the article information
				if (!numItems) {
					doc.write('<i>No news is good news!</i>');
				} else {
					var i;
					var theEntry;
					var theUrl;
					var info;
		
					for (i=0; i<numItems; i++) {
						theEntry = itemArray.queryElementAt(i, Ci.nsIFeedEntry);
		
						if (theEntry) {
							theUrl = doc.write(
								'<b><a href="' + theEntry.link.resolve('') + '">' + 
									theEntry.title.text + 
								'</a></b><br>'
							);
		
							if (theEntry.summary) {
								info = theEntry.summary.text + '<p><hr><p>';
							} else {
								info = theEntry.content.text + '<p><hr><p>';
							}
		
							doc.write('<blockquote>' + info);
							doc.write('</blockquote><p>');
						}
					}
				}
		
				// Close the document; we're done!
				doc.write('</body></html>');
				doc.close();
			}
		});
	}
}; // End of FeedParserResultListener

/**
 * Parse RSS feed (passed as XML string).
 * @param {String} aUrl Url of the feed.
 * @param {String} aXml XML contents of the feed.
 * @see https://developer.mozilla.org/en-US/docs/Mozilla/Tech/Feed_content_access_API
 * @https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIFeed
 */
function Utils_ParseFeed(aUrl, aXml) {
	console.log('Feed URL: ' + aUrl);
	console.log('Feed string length: ' + aXml.length);

	var ioService = Cc['@mozilla.org/network/io-service;1'].getService(Ci.nsIIOService);
	var uri = ioService.newURI(aUrl, null, null);

	if (aXml.length) {
		var parser = Cc['@mozilla.org/feed-processor;1'].createInstance(Ci.nsIFeedProcessor);
		var listener = new FeedParserResultListener();
		try {
			parser.listener = listener;
			parser.parseFromString(aXml, uri);
		} catch(e) {
			console.log('Error parsing feed.');
		}
	}
} // end Utils_ParseFeed(aXml)

// ===========================================================================
// Export public functions

exports.getThemeColor = Utils_GetThemeColor;
exports.fetchFeed     = Utils_FetchFeed;
exports.parseFeed     = Utils_ParseFeed;
