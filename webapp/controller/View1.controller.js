sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"ui5pathdrawer/ui5pathdrawer/controls/PolylineDrawer"
], function (Controller, PolylineDrawer) {
	"use strict";

	return Controller.extend("ui5pathdrawer.ui5pathdrawer.controller.View1", {
		onInit: function () {

		},
		onBeforeRendering: function() {

			// Get PolylineDrawer Placeholder
			this.oPolylineDrawerHolder = this.byId("PolylineDrawerHolder");
			// New PolylineDrawer
			this.oPolylineDrawer = new sap.cc.PolylineDrawer(this);

			// Add Control to View Element
			this.oPolylineDrawerHolder.addItem(this.oPolylineDrawer);
		}
	});
});