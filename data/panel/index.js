/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Called when panel is shown.
 * @param {String} aContentStyle
 */
function onShow(aContentStyle) {
	console.log('[panel/index.js].onShow');
	console.log('Material Design Style: ' + aContentStyle);

	onStyle(aContentStyle);
} // end onShow()

/**
 * Called when panel is hiding.
 */
function onHide() {
	console.log('[panel/index.js].onHide');
} // end onHide()

/**
 * Called when user changes `contentStyle` preference.
 * @param {String} aContentStyle
 */
function onStyle(aContentStyle) {
	console.log('[panel/index.js].onStyle');
	console.log('Material Design Style: ' + aContentStyle);

	if (aContentStyle !== undefined) {
		document.body.classList.add(aContentStyle);
	}
} // end onStyle(aContentStyle)

// ===========================================================================
self.port.on('show', onShow);
self.port.on('hide', onHide);
self.port.on('style', onStyle);
