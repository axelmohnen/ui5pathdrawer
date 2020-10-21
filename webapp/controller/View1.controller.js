/* global evothings:true */
/* global Uint8Array */
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"ui5pathdrawer/ui5pathdrawer/controls/PolylineDrawer",
	"ui5pathdrawer/ui5pathdrawer/libs/evothings/evothings",
	"sap/m/MessageToast"
], function (Controller, PolylineDrawer, evothingsjs, MessageToast) {
	"use strict";
	var ble = null;
	var that = null;
	return Controller.extend("ui5pathdrawer.ui5pathdrawer.controller.View1", {
		onInit: function () {
			that = this;

			// Init logger
			var aLogger = [];
			var oModelLogger = this.getOwnerComponent().getModel("logger");
			oModelLogger.setData(aLogger);

			//Init BLE connetion data
			this.initConnectData();
			this.retry = 10;

			// Create View Model
			var oViewModel = new sap.ui.model.json.JSONModel({
				"PathText": "Initial",
				"enabledConnectButton": true,
				"enabledRunButton": false,
				"iconConnectButton": "sap-icon://disconnected" //sap-icon://connected
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

		initConnectData: function () {
			// Discovered devices.
			this.knownDevices = {};
			// Reference to the device we are connecting to.
			this.connectee = null;
			// Handle to the connected device.
			this.deviceHandle = null;
			// Handles to characteristics and descriptor for reading and
			// writing data from/to the Arduino using the BLE shield.
			this.characteristicRead = null;
			this.characteristicWrite = null;
			this.descriptorNotification = null;
			this.sSerialData = "";
		},

		onDeviceReady: function () {
			ble = evothings.ble;
		},

		buttonConnectPress: function () {

			if (!this.connectee) {
				// Evothings BLE plugin
				this.startScan();
			} else {
				// Evothings BLE plugin
				this.disconnectDevice();
			}
		},

		updateConnectIcon: function (bIsConnected) {
			//Get View Model
			var oViewModel = this.getView().getModel("ViewModel");
			if (!oViewModel) {
				return;
			}

			if (bIsConnected) {
				//Set Button icon
				oViewModel.setProperty("/iconConnectButton", "sap-icon://connected");
			} else {
				//Set Button icon
				oViewModel.setProperty("/iconConnectButton", "sap-icon://disconnected");
			}

			//Set View Model
			this.getView().setModel(oViewModel, "ViewModel");
		},

		onRunPress: function (oEvent) {
			var sRoute = this.oPolylineDrawer.calcRoute();
			//Set View Model
			var oViewModel = this.getView().getModel("ViewModel");

			oViewModel.setProperty("/PathText", sRoute);
			//Set View Model
			this.getView().setModel(oViewModel, "ViewModel");
		},

		disconnectDevice: function () {
			//Stop BLE scanning
			this.initConnectData();
			evothings.ble.closeConnectedDevices();
			//Update Icon of connection button
			that.updateConnectIcon(false);
		},

		startScan: function () {
			//Start BLE scanning
			this.initConnectData();
			evothings.ble.stopScan();
			evothings.ble.startScan(function (deviceInfo) {
				if (that.knownDevices[deviceInfo.address]) {
					return;
				}
				that.setLog("Information", "found device: " + deviceInfo.name);
				that.knownDevices[deviceInfo.address] = deviceInfo;
				if (deviceInfo.name === "HMSoft" && !that.connectee) {
					that.setLog("Information", "Found HMSoft");
					that.connectee = deviceInfo;
					that.connect(deviceInfo.address);
				}
			}, function (errorCode) {
				that.setLog("Error", "startScan error: " + errorCode);
			});
		},
		connect: function (address) {
			evothings.ble.stopScan();
			that.setLog("Information", "Connecting...");
			evothings.ble.connect(address, function (connectInfo) {
				if (connectInfo.state === 2) {
					// Connected
					that.setLog("Information", "Connected");
					that.deviceHandle = connectInfo.deviceHandle;
					that.getServices(connectInfo.deviceHandle);
					
					//Update Icon of connection button
					that.updateConnectIcon(true);
				} else {
					that.setLog("Error", "Disconnected");
					if (that.retry > 0) {
						//Decrement retry counter
						that.retry -= 1;
						//Retry BLE connection
						that.onDeviceReady();
					}
				}
			}, function (errorCode) {
				that.setLog("Error", "connect error: " + errorCode);
			});
		},
		getServices: function (deviceHandle) {
			that.setLog("Information", "Reading services...");
			evothings.ble.readAllServiceData(deviceHandle, function (services) {
				// Find handles for characteristics and descriptor needed.
				for (var si in services) {
					var service = services[si];
					for (var ci in service.characteristics) {
						var characteristic = service.characteristics[ci];
						if (characteristic.uuid === "0000ffe1-0000-1000-8000-00805f9b34fb") {
							that.characteristicRead = characteristic.handle;
						}
						if (characteristic.uuid === "0000ffe1-0000-1000-8000-00805f9b34fb") {
							that.characteristicWrite = characteristic.handle;
						}
						for (var di in characteristic.descriptors) {
							var descriptor = characteristic.descriptors[di];
							if (characteristic.uuid === "0000ffe1-0000-1000-8000-00805f9b34fb" && descriptor.uuid ===
								"00002902-0000-1000-8000-00805f9b34fb") {
								that.descriptorNotification = descriptor.handle;
							}
						}
					}
				}
				if (that.characteristicRead && that.characteristicWrite && that.descriptorNotification) {
					that.setLog("Information", "RX/TX services found");
					that.startReading(deviceHandle);
				} else {
					that.setLog("Error", "ERROR: RX/TX services not found!");
				}
			}, function (errorCode) {
				that.setLog("Error", "readAllServiceData error: " + errorCode);
			});
		},
		write: function (writeFunc, deviceHandle, handle, value) {
			if (handle) {
				ble[writeFunc](deviceHandle, handle, value, function () {
					that.setLog("Information", writeFunc + ": " + handle + " success.");
				}, function (errorCode) {
					that.setLog("Error", writeFunc + ": " + handle + " error: " + errorCode);
				});
			}
		},
		startReading: function (deviceHandle) {
			this.setLog("Information", "Enabling notifications...");
			// Turn notifications on.
			this.write("writeDescriptor", deviceHandle, this.descriptorNotification, new Uint8Array([
				1,
				0
			]));
			// Start reading notifications.
			evothings.ble.enableNotification(deviceHandle, this.characteristicRead, function (data) {
				//Retrieve sensor data via BLE
				var sSerialData = String.fromCharCode.apply(null, new Uint8Array(data));
				var sSensorData = that.deserialize(sSerialData);

				if (sSensorData) {
					//Update moto infos
					that.update(sSensorData);
				}

			}, function (errorCode) {
				that.setLog("Error", "enableNotification error: " + errorCode);
			});
		},

		deserialize: function (sSerialData) {
			//Set serial data string
			this.sSerialData += sSerialData;

			//Search for line start character
			var iLineStartPos = this.sSerialData.search("<");
			if (iLineStartPos === -1) {
				return;
			} else {
				//Keep the remaining serial data string
				this.sSerialData = this.sSerialData.substring(iLineStartPos);
			}

			//Search for line end character
			var iLineEndPos = this.sSerialData.search(">");
			if (iLineEndPos === -1) {
				return;
			}

			//Get sensor data by offset
			var sSensorData = this.sSerialData.substring(1, iLineEndPos);

			//Keep the remaining serial data string
			this.sSerialData = this.sSerialData.substring((iLineEndPos + 1));
			return sSensorData;

		},
	});
});