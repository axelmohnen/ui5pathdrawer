sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"ui5pathdrawer/ui5pathdrawer/controls/PolylineDrawer"
], function (Controller, PolylineDrawer) {
	"use strict";
	return Controller.extend("ui5pathdrawer.ui5pathdrawer.controller.View1", {
		onInit: function () {

			// Create View Model
			var oViewModel = new sap.ui.model.json.JSONModel({
				"PathText": "Initial"
			});
			//Set View Model
			this.getView().setModel(oViewModel, "ViewModel");
		},
		onBeforeRendering: function () {
			// Get PolylineDrawer Placeholder
			this.oPolylineDrawerHolder = this.byId("PolylineDrawerHolder");
			// New PolylineDrawer
			this.oPolylineDrawer = new sap.cc.PolylineDrawer(this);
			// Add Control to View Element
			this.oPolylineDrawerHolder.addItem(this.oPolylineDrawer);
		},
		/**
		 *@memberOf ui5pathdrawer.ui5pathdrawer.controller.View1
		 */
		onButtonPress: function (oEvent) {
			var sRoute = this.oPolylineDrawer.calcRoute();
			//Set View Model
			var oViewModel = this.getView().getModel("ViewModel");
			
			oViewModel.setProperty("/PathText", sRoute);
			//Set View Model
			this.getView().setModel(oViewModel, "ViewModel");
		}
	});
});