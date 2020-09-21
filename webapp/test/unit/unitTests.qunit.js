/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"ui5pathdrawer/ui5pathdrawer/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});