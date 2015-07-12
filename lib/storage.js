/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Contains all necessary functions for working with Feeds Reader SQLite storage.
 */

var { Cc, Ci, Cu } = require('chrome');

Cu.import('resource://gre/modules/Sqlite.jsm');
Cu.import('resource://gre/modules/Task.jsm');

/**
 * @returns {String} Path to our SQLite database.
 */
function getDatabaseFilePath() {
	// Get profile directory.
	var file = Cc['@mozilla.org/file/directory_service;1'].
		getService(Ci.nsIProperties).
		get('ProfD', Ci.nsIFile);

	// Append the file name.
	file.append('feeds-reader.sqlite');

	return file.path;
} // end getDatabaseFilePath()

/**
 * @type {String} Path to SQLite database file.
 */
const STORAGE_FILE = getDatabaseFilePath();

/**
 * @param {Number} aId
 * @param {String} aTitle
 * @returns {Object} Create new category.
 */
function createOutlineCategory(aId, aTitle) {
	return {
		/** @property {Number} Id */
		get Id() { return aId; },
		set Id(val) { aId = parseInt(val); },
		/** @property {String} Title */
		get Title() { return aTitle; },
		set Title(val) { aTitle = val; }
	};
} // end createOutlineCategory(id, title)

/**
 * @param {Number} aId
 * @param {Number} aCategoryId
 * @param {String} aTitle
 * @param {String} aType
 * @param {String} aHtmlUrl
 * @param {String} aXmlUrl
 * @returns {Object} Create new feed.
 */
function createOutlineFeed(aId, aCategoryId, aTitle, aType, aHtmlUrl, aXmlUrl) {
	return {
		/** @property {Number} Id */
		get Id() { return aId; },
		set Id(val) { aId = parseInt(val); },
		/** @property {Number} CategoryId */
		get CategoryId() { return aCategoryId; },
		set CategoryId(val) { aCategoryId = parseInt(val); },
		/** @property {String} Title */
		get Title() { return aTitle; },
		set Title(val) { aTitle = val; },
		/** @property {String} Type */
		get Type() { return aType; },
		set Type(val) { aType = val; },
		/** @property {String} HtmlUrl */
		get HtmlUrl() { return aHtmlUrl; },
		set HtmlUrl(val) { aHtmlUrl = val; },
		/** @property {String} XmlUrl */
		get XmlUrl() { return aXmlUrl; },
		set XmlUrl(val) { aXmlUrl = val; }
	};
} // end createOutlineFeed(aId, aCategoryId, aTitle, aType, aHtmlUrl, aXmlUrl)

/**
 * Create database schema.
 * @returns {Promise}
 */
function Storage_CreateSchema() {
	return Task.spawn(
		function* createSchema() {
			let conn = yield Sqlite.openConnection({ path: STORAGE_FILE });

			try {
				yield conn.execute('PRAGMA foreign_keys = ON;');
				yield conn.execute('CREATE TABLE Category (Id INTEGER PRIMARY KEY ASC, Title TEXT UNIQUE NOT NULL);');
				yield conn.execute('INSERT INTO Category VALUES (1, "Default category");');
				yield conn.execute('CREATE TABLE Feed (Id INTEGER PRIMARY KEY ASC, CategoryId INTEGER NOT NULL, Title TEXT NOT NULL, Type TEXT, HtmlUrl TEXT, XmlUrl TEXT, FOREIGN KEY (CategoryId) REFERENCES Category);');
				yield conn.execute('PRAGMA user_version = 1;');

				// =============================================================================
				// TODO Remove this!
				// Categories
				yield conn.execute('INSERT INTO Category VALUES (2, "Google");');
				yield conn.execute('INSERT INTO Category VALUES (3, "Linux");');
				yield conn.execute('INSERT INTO Category VALUES (4, "Mozilla");');
				yield conn.execute('INSERT INTO Category VALUES (5, "Must-Read");');
				yield conn.execute('INSERT INTO Category VALUES (6, "AngularJS Blogs");');
				yield conn.execute('INSERT INTO Category VALUES (7, "Development");');
				yield conn.execute('INSERT INTO Category VALUES (8, "Haiku");');
				// Feeds
				yield conn.execute('INSERT INTO Feed VALUES ( 1, 8, "Haiku Project blogs", "rss", "https://www.haiku-os.org/blog", "http://www.haiku-os.org/blog/feed");');
				//yield conn.execute('INSERT INTO Feed VALUES ( 2, 7, "DZone: php", "rss", "http://www.dzone.com/links/tag/php.html", "http://www.dzone.com/feed/frontpage/php/rss.xml");');
				//yield conn.execute('INSERT INTO Feed VALUES ( 3, 7, "Santiago Arias\'s blog", "rss", "http://www.dzone.com/links/tag/php.html", "http://feeds.feedburner.com/sanarias");');
				//yield conn.execute('INSERT INTO Feed VALUES ( 4, 7, "PHP::Impact ( [str Blog] )", "rss", "http://blog.fedecarg.com", "http://phpimpact.wordpress.com/feed/");');
				//yield conn.execute('INSERT INTO Feed VALUES ( 5, 7, "Ajaxian", "rss", "http://feeds.feedburner.com/ajaxian", "http://ajaxian.com");');
				//yield conn.execute('INSERT INTO Feed VALUES ( 6, 4, "Planet Mozilla", "rss", "http://planet.mozilla.org/", "http://planet.mozilla.org/rss20.xml");');
				//yield conn.execute('INSERT INTO Feed VALUES ( 7, 4, "Mozilla Hacks", "rss", "http://hacks.mozilla.org", "http://hacks.mozilla.org/feed/");');
				//yield conn.execute('INSERT INTO Feed VALUES ( 8, 4, "Mozilla Add-ons Blog", "rss", "https://blog.mozilla.org/addons", "http://blog.mozilla.com/addons/feed/");');
				//yield conn.execute('INSERT INTO Feed VALUES ( 9, 7, "Opensource.com", "rss", "http://opensource.com/frontpage", "http://opensource.com/feed");');
				//yield conn.execute('INSERT INTO Feed VALUES (10, 7, "OMG! Ubuntu!", "rss", "http://www.omgubuntu.co.uk", "http://feeds.feedburner.com/d0od");');
				yield conn.execute('INSERT INTO Feed VALUES (11, 2, "The Go Programming Language Blog", "rss", "http://blog.golang.org/", "http://blog.golang.org/feeds/posts/default");');
				// =============================================================================

				return true;
			} catch(e) {
				console.error(e);
				return false;
			} finally {
				yield conn.close();
			}
		}
	);
} // end Storage_CreateSchema()

/**
 * Returns promise with user version of our SQLite database.
 * @returns {Promise} If promise is resolved returns `Number`.
 */
function Storage_GetStorageVersion() {
	return Task.spawn(
		function* getStorageVersion() {
			let conn = yield Sqlite.openConnection({ path: STORAGE_FILE });
	
			try {
				let result = yield conn.execute('PRAGMA user_version;')
				return (parseInt(result[0].getResultByIndex(0)));
			} catch(e) {
				console.error(e);
				return 0;
			} finally {
				yield conn.close();
			}
		}
	);
} // end Storage_GetStorageVersion()

/**
 * Return all feeds categories.
 * @returns {Promise}
 */
function Storage_GetCategories() {
	return Task.spawn(
		function* getCategories() {
			let conn = yield Sqlite.openConnection({ path: STORAGE_FILE });
			let data = [];
	
			try {
				let result = yield conn.execute('SELECT * FROM Category WHERE 1;');

				for (let row of result) {
					console.log(createOutlineCategory(
						row.getResultByName('Id'),
						row.getResultByName('Title')
					));
					data.push(category);
				}

				return data;
			} catch(e) {
				console.error(e);
				return false;
			} finally {
				yield conn.close();
			}
		}
	);
} // end Storage_GetCategories()

/**
 * Return all feeds.
 * @returns {Promise}
 */
function Storage_GetFeeds() {
	return Task.spawn(
		function* getFeeds() {
			let conn = yield Sqlite.openConnection({ path: STORAGE_FILE });
			let data = [];
	
			try {
				let result = yield conn.execute('SELECT * FROM Feed;');

				for (let row of result) {
					data.push(createOutlineFeed(
						row.getResultByName('Id'),
						row.getResultByName('CategoryId'),
						row.getResultByName('Title'),
						row.getResultByName('Type'),
						row.getResultByName('HtmlUrl'),
						row.getResultByName('XmlUrl')
					));
				}

				return data;
			} catch(e) {
				console.error(e);
				return false;
			} finally {
				yield conn.close();
			}
		}
	);
} // end Storage_GetFeeds()

/**
 * Return feeds for given category.
 * @param {Number} aCategoryId
 * @returns {Promise}
 */
function Storage_GetFeedsByCategory(aCategoryId) {
	return Task.spawn(
		function* getFeeds() {
			let conn = yield Sqlite.openConnection({ path: STORAGE_FILE });
			let data = [];
	
			try {
				let result = yield conn.execute(
					'SELECT * FROM Feed WHERE CategoryId = ?;', 
					[aCategoryId]
				);

				for (let row of result) {
					data.push(createOutlineFeed(
						row.getResultByName('Id'),
						row.getResultByName('CategoryId'),
						row.getResultByName('Title'),
						row.getResultByName('Type'),
						row.getResultByName('HtmlUrl'),
						row.getResultByName('XmlUrl')
					));
				}

				return data;
			} catch(e) {
				console.error(e);
				return false;
			} finally {
				yield conn.close();
			}
		}
	);
} // end Storage_GetFeedsByCategory()

// ===========================================================================
// Export public functions

exports.createSchema       = Storage_CreateSchema;
exports.getStorageVersion  = Storage_GetStorageVersion;
exports.getCategories      = Storage_GetCategories;
exports.getFeeds           = Storage_GetFeeds;
exports.getFeedsByCategory = Storage_GetFeedsByCategory;
