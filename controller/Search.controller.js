sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"Trace/model/Formatter",
	"sap/ui/core/util/Export",
	"sap/ui/core/util/ExportTypeCSV",
	"sap/m/MessageBox"
], function(Controller, Formatter, Export, ExportTypeCSV) {
	"use strict";

	return Controller.extend("Trace.controller.Search", {
		//on initialization
		onInit: function() {
			this.oModel = this.getOwnerComponent().getModel("TraceReport");
			this.onSearchandAdvancedSerachModel();
			this.i18nModel = this.getView().getModel("i18n");
			this.sessionExpireOneTime = true;
			this.IntiateOrSerchCustomerInd = "";
			var oSelValue = this.getView().getModel("searchAndAdvancedSearchModelSet").getData().Search;
			oSelValue.openButtonEnable = false;
			this.getView().getModel("searchAndAdvancedSearchModelSet").refresh();
		},
		getMyComponent: function() {
			"use strict";
			var sComponentId = sap.ui.core.Component.getOwnerIdFor(this.getView());
			return sap.ui.component(sComponentId);
		},
		sessionExpiredCall: function() {
			var that = this;
			var opened = "N";
			// var IDLE_TIMEOUT = 1680; //seconds
			var IDLE_TIMEOUT = 3480; //seconds
			var _idleSecondsTimer = null;
			var _idleSecondsCounter = 0;

			document.onclick = function() {
				if (opened === "N") {
					_idleSecondsCounter = 0;
				}
			};

			/*	document.onmousemove = function() {
					_idleSecondsCounter = 0;
				};*/

			document.onkeypress = function() {
				if (opened === "N") {
					_idleSecondsCounter = 0;
				}
			};

			_idleSecondsTimer = window.setInterval(CheckIdleTime, 1000);

			function CheckIdleTime() {
				_idleSecondsCounter++;
				// console.log("Session Idle Time :" + _idleSecondsCounter);
				var oPanel = document.getElementById("SecondsUntilExpire");
				if (oPanel) {
					oPanel.innerHTML = (IDLE_TIMEOUT - _idleSecondsCounter) + "";
				}
				if (_idleSecondsCounter >= IDLE_TIMEOUT) {
					if (_idleSecondsCounter >= (IDLE_TIMEOUT + 120)) {
						opened = "N";
						window.clearInterval(_idleSecondsTimer);
						that.backToLogoutScreen();
						return;
					}
					if (opened === "N") {
						opened = "Y";
						var msgExp = that.i18nModel.getProperty("sessionExpiredWantToextend");
						sap.m.MessageBox.confirm(msgExp, {
							title: "Confirm", // default
							styleClass: "sapUiSizeCompact", // default
							actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
							onClose: function(action) {
								if (action === "YES") {
									opened = "N";
									window.clearInterval(_idleSecondsTimer);
									that.sessionExpiredCall();
								} else {
									opened = "N";
									window.clearInterval(_idleSecondsTimer);
									that.backToLogoutScreen();
								}
							}
						});
					}
				}
			}
		},

		backToLogoutScreen: function() {
			var that = this;
			/*	var msgExp = that.i18nModel.getProperty("sessitionExpired");
				sap.m.MessageBox.information(msgExp, {
					title: "Information", // default
					styleClass: "sapUiSizeCompact", // default
					onClose: function() {*/
			document.location.href = "/sap/public/bc/icf/logoff";
			/*	}
			});*/
		},

		//change customer
		changeCustomer: function() {

		},

		//home page
		onCancelRequest: function() {
			window.location.href = '#Shell-home';
		},

		//on after Rendering
		onAfterRendering: function() {
			this.i18nModel = this.getView().getModel("i18n");
			if (this.sessionExpireOneTime) {
				if (sap.ui.getCore().getModel("SessitonExpireIndSet") === undefined) {
					var sessionMod = new sap.ui.model.json.JSONModel({
						ind: "YES"
					});
					sap.ui.getCore().setModel(sessionMod, "SessitonExpireIndSet");
					this.sessionExpireOneTime = false;
					this.sessionExpiredCall();
				}
			}
		},
		onClickOpenRecod: function() {
			this.getContextData();

		},
		resetFilters: function() {
			var columns = this.byId("exportTable").getColumns();
			if(columns){
				for (var i = 0, l = columns.length; i < l; i++) {
				var isFiltered = columns[i].getFiltered();
				if (isFiltered) {
					// clear column filter if the filter is set
					columns[i].filter("");
				}
			}
			}
			
		},

		getContextData: function() {

			var selectedIndex = this.getView().byId("exportTable").getSelectedIndex();
			if (selectedIndex >= 0) {
				var oA = [];
				//	var obj = oEvent.getParameters().rowContext.getObject();
				//	this.getView().setModel(obj, "searchTableModelSet");
				//	sap.ui.getCore().setModel(obj, "searchTableModelSet");
				var reqId = this.getView().byId("exportTable").getContextByIndex(selectedIndex).getObject().RequestID;
				var that = this;

				var oBusyDialog = new sap.m.BusyDialog();
				oBusyDialog.open();
				// var Filter1 = new sap.ui.model.Filter('URL', 'EQ',
				// 	"/RESTAdapter/SmartSearch_Basic/MDM?q='" + sQuery + "'");
				var Filter1 = new sap.ui.model.Filter('URL', 'EQ',
					"/RESTAdapter/REST_BPM/TraceabilityReport?SearchTerm=" + reqId);
				// RESTAdapter/REST_BPM/TraceabilityReport?SearchTerm=102569810
				this.oModel.read(
					"/BusinessPartnerSet", {
						method: "GET",
						filters: [Filter1],
						success: function(oData, oResponse) {
							oBusyDialog.close();
							var oSearchArray = [];
							if (oData.results[0].Response.includes("<h1>Error</h1>")) {
								var message = oData.results[0].Response.split("<pre>")[1].split("</pre>")[0];
								that.errMsg(message);
							} else {
								var oSearch = JSON.parse(oData.results[0].Response);
								if (oSearch["ProcessDetails"] === undefined) {
									oSearch = {
										ProcessDetails: []
									};
								}
								var oSResults = oSearch["ProcessDetails"];
								if (oSResults.length === undefined) {
									oSResults = Array(oSResults);
								}
								oSearchArray = oSResults;
							}
							that.parseModelTableFormat(oSearchArray);
						},
						error: function(oError) {
							oBusyDialog.close();
						}
					});
			}
		},
		parseModelTableFormat: function(Response) {

			if (Response.length > 0) {
				var itemdata = {
					"RequestID": Response[0].reqid,
					"Grid": Response[0].grid,
					"AccountName": Response[0].name,
					"RequestorEmail": Response[0].requestor,
					"RequestorCode1": Response[0].code1,
					"Status": Response[0].status,
					"Type": "",
					"StartData": Response[0].sdate,
					"EndDate": Response[0].edate,
					"system": Response[0].system,
					"country": Response[0].country,
					"dcomment": Response[0].dcomment,
					"rcomment": Response[0].rcomment,
					"attachment": Response[0].attachment != undefined ? Response[0].attachment : [],
					"TaskDetails": Response[0].TaskDetails
				};

			}

			//	oSModel.setSizeLimit(AccData.length);
			//	var oSModel = new sap.ui.model.json.JSONModel();
			//	oSModel.setData(itemdata);
			this.getView().setModel(itemdata, "searchTableModelSet");
			sap.ui.getCore().setModel(itemdata, "searchTableModelSet");
			//Navigate after setting the model
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("Overview", {
				contextPath: "Next"
			}, true);

		},
		afetrDilogOpen: function() {
			var d = new Date();

			sap.ui.getCore().byId("idSdate").setMaxDate(d);
			sap.ui.getCore().byId("idSdate").setInitialFocusedDateValue(d);
			sap.ui.getCore().byId("idEdate").setMaxDate(d);
			sap.ui.getCore().byId("idEdate").setInitialFocusedDateValue(d);
		},
		onPressAdvancedSearchButton: function() {
			if (!this._oValueHelpDialogAS) {
				this._oValueHelpDialogAS = sap.ui.xmlfragment("Trace.Fragments.advancedSearch", this);
				this.getView().addDependent(this._oValueHelpDialogAS);
			}

			this._oValueHelpDialogAS.attachAfterOpen(null, this.afetrDilogOpen);
			this._oValueHelpDialogAS.open();

			this._oValueHelpDialogAS.fireAfterOpen();

			if (!this.firstTimeReadF4advSearch) {
				this.firstTimeReadF4advSearch = new Date();
				this.readCountryData();
				this.createUiDataAdvSearch();
				this.SystemDataModel();
			}
		},

		readCountryData: function(url) {
			var that = this;
			this.oModel = this.getOwnerComponent().getModel("TraceReport");
			var oBusyDialog = new sap.m.BusyDialog();
			oBusyDialog.open();
			var Filter = new sap.ui.model.Filter('URL', 'EQ', "/RESTAdapter/REST_MDM/MDMRefTable/REFCNTRY?order=englishShortName");
			this.oModel.read(
				"/BusinessPartnerSet", {
					method: "GET",
					filters: [Filter],
					success: function(oData, oResponse) {
						oBusyDialog.close();
						var dataResultArr = [];
						if (oData.results[0].Response.includes("<h1>Error</h1>")) {
							var message = oData.results[0].Response.split("<pre>")[1].split("</pre>")[0];
							that.errMsg(message);
							dataResultArr = [];
						} else {
							var dataAfterParse = JSON.parse(oData.results[0].Response);
							if (dataAfterParse["BaseObject.Pager"].item === undefined) {
								dataAfterParse["BaseObject.Pager"].item = [];
							}
							dataResultArr = dataAfterParse["BaseObject.Pager"].item;
						}
						var oODataJSONModel = new sap.ui.model.json.JSONModel({
							"results": dataResultArr
						});
						oODataJSONModel.setSizeLimit(dataResultArr.length);
						that.getView().setModel(oODataJSONModel, "CountryComboSet");
					},
					error: function(oError) {
						oBusyDialog.close();
					}

				}
			);
		},
		//read system Data
		SystemDataModel: function() {
			var that = this;
			this.oModel = this.getOwnerComponent().getModel("TraceReport");
			var oBusyDialog = new sap.m.BusyDialog();
			oBusyDialog.open();
			var Filter = new sap.ui.model.Filter('URL', 'EQ', "/RESTAdapter/REST_MDM/MDMRefTable/ITOLOGICALCOMP?order=logicalCompId");
			this.oModel.read(
				"/BusinessPartnerSet", {
					method: "GET",
					filters: [Filter],
					success: function(oData, oResponse) {
						oBusyDialog.close();
						var dataResultArr = [];
						if (oData.results[0].Response.includes("<h1>Error</h1>")) {
							var message = oData.results[0].Response.split("<pre>")[1].split("</pre>")[0];
							that.errMsg(message);
							dataResultArr = [];
						} else {
							var dataAfterParse = JSON.parse(oData.results[0].Response);
							if (dataAfterParse["BaseObject.Pager"].item === undefined) {
								dataAfterParse["BaseObject.Pager"].item = [];
							}
							dataResultArr = dataAfterParse["BaseObject.Pager"].item;
						}
						var oODataJSONModel = new sap.ui.model.json.JSONModel({
							"results": dataResultArr
						});
						oODataJSONModel.setSizeLimit(dataResultArr.length);
						that.getView().setModel(oODataJSONModel, "AdvSearchSystemModelSet");

					},
					error: function(oError) {
						oBusyDialog.close();
					}

				}
			);
		},

		onSearchandAdvancedSerachModel: function() {
			var data = {
				Search: {
					openButtonEnable: false,
					ExportEnable: true
				},
				AdvancedSearch: {
					"ReqIDFrom": "",
					"ReqIDTo": "",
					"GRID": "",
					"ApplicationID": "",
					"AccountName": "",
					"Requester": "",
					"RequestStatus": "",
					"RequestorType": "",
					"Priority": "",
					"StartDate": "",
					"EndDate": "",
					"Country": "",
					"System": "",
					"PartitionKey": ""
				}

			};
			var oSModel = new sap.ui.model.json.JSONModel(data);
			this.getView().setModel(oSModel, "searchAndAdvancedSearchModelSet");
			sap.ui.getCore().setModel(oSModel, "searchAndAdvancedSearchModelSet");
		},
		createUiDataAdvSearch: function() {
			var data = {
				ReqStatus: [{
					Key: "COMPLETED",
					value: "Completed"
				}, {
					Key: "IN_PROGRESS",
					value: "In Progress"
				}],
				ReqType: [{
					Key: "Create",
					value: "Create"
				}, {
					Key: "Change",
					value: "Change"
				}, {
					Key: "Extension",
					value: "Extension"
				}, {
					Key: "New Subscription",
					value: "New Subscription"
				}],
				Priority: [{
					Key: "High",
					value: "High"
				}, {
					Key: "Medium",
					value: "Medium"
				}]
			};
			var oDDModel = new sap.ui.model.json.JSONModel(data);
			this.getView().setModel(oDDModel, "UiDropdownModel");
			sap.ui.getCore().setModel(oDDModel, "UiDropdownModel");
		},
		//	General Error Message Box
		errMsg: function(errorMsg) {
			sap.m.MessageBox.show(
				errorMsg, {
					styleClass: 'sapUiSizeCompact',
					icon: sap.m.MessageBox.Icon.ERROR,
					title: "Error",
					actions: [sap.m.MessageBox.Action.OK],
					onClose: function(oAction) {}
				}
			);
		},
		searchtablemodel: function(Response) {
			var partitionKey = this.getView().byId("idLoadMore").data("PartitionKey");
			if(partitionKey === ""  || partitionKey === undefined || partitionKey == null){
				this.getView().byId("idLoadMore").setEnabled(false);
			} else{
				this.getView().byId("idLoadMore").setEnabled(true);
			}
			var AccData = [];
               this.resetFilters(); // Reset all the applied filters in ui table
			if (Response.length > 0) {
				var itemdata = {
					"RequestID": Response[0].reqid,
					"Grid": Response[0].grid,
					"AccountName": Response[0].name,
					"RequestorEmail": Response[0].requestor,
					"RequestorCode1": Response[0].code1,
					"Status": Response[0].status,
					"Type": "",
					//	"StartData": Response[i].sdate,
						"StartData": Response[0].sdate ? sap.ca.ui.model.format.DateFormat.getTimeInstance({pattern: "dd.MM.yyyy\' \'HH:mm:ss"}).format(Response[0].sdate) : "",
					//	"EndDate": Response[i].edate,
						"EndDate": Response[0].edate ? sap.ca.ui.model.format.DateFormat.getTimeInstance({pattern: "dd.MM.yyyy\' \'HH:mm:ss"}).format(Response[0].edate) : "",
					
					"system": Response[0].system,
					"country": Response[0].country,
					"dcomment": Response[0].dcomment,
					"rcomment": Response[0].rcomment,
					"attachment": Response[0].attachment != undefined ? Response[0].attachment : [],
					"TaskDetails": Response[0].TaskDetails
				};
				AccData.push(itemdata);
			}

			//	oSModel.setSizeLimit(AccData.length);
			var oSModel = new sap.ui.model.json.JSONModel({
				"results": AccData
			});
			this.getView().setModel(oSModel, "searchModelSet");
			sap.ui.getCore().setModel(oSModel, "searchModelSet");
			this.getView().getModel("searchModelSet").refresh();
			//Disable Open button
			this.getView().getModel("searchAndAdvancedSearchModelSet").refresh();
			var oSelValue = this.getView().getModel("searchAndAdvancedSearchModelSet").getData().Search;
			oSelValue.openButtonEnable = false;
			this.getView().getModel("searchAndAdvancedSearchModelSet").refresh();
		},

		//This method has been implemented for binding the table after advance search as there is diffrence in data structure
		searchtablemodelAdvSrch: function(Response) {
			var partitionKey = this.getView().byId("idLoadMore").data("PartitionKey");
			if(partitionKey === ""  || partitionKey === undefined || partitionKey == null){
				this.getView().byId("idLoadMore").setEnabled(false);
			} else{
				this.getView().byId("idLoadMore").setEnabled(true);
			}
			var AccData = [];
                     this.resetFilters(); // Reset all the applied filters in ui table
			if (Response.length > 0) {
				for (var i = 0; i < Response.length; i++) {
					var itemdata = {
						"RequestID": Response[i].reqid ?  Response[i].reqid.toString() : "",
						"Grid": Response[i].grid ? Response[i].grid.toString() : "",
						"AccountName": Response[i].name ? Response[i].name.toString() : "",
						"RequestorEmail": Response[i].requestor,
						"RequestorCode1": Response[i].code1 ? Response[i].code1.toString() : "",
						"Status": Response[i].status,

					//	"StartData": Response[i].sdate,
						"StartData": Response[i].sdate ? sap.ca.ui.model.format.DateFormat.getTimeInstance({pattern: "dd.MM.yyyy\' \'HH:mm:ss"}).format(Response[i].sdate) : "",
					//	"EndDate": Response[i].edate,
						"EndDate": Response[i].edate ? sap.ca.ui.model.format.DateFormat.getTimeInstance({pattern: "dd.MM.yyyy\' \'HH:mm:ss"}).format(Response[i].edate) : "",
						"system": Response[i].system,
						"country": Response[i].country

					};
					AccData.push(itemdata);
				}

			}

			var oSModel = new sap.ui.model.json.JSONModel({
				"results": AccData
			});
			oSModel.setSizeLimit(AccData.length);
			this.getView().setModel(oSModel, "searchModelSet");
			sap.ui.getCore().setModel(oSModel, "searchModelSet");
			this.getView().getModel("searchModelSet").refresh();
			//Disable Open button
			this.getView().getModel("searchAndAdvancedSearchModelSet").refresh();
			var oSelValue = this.getView().getModel("searchAndAdvancedSearchModelSet").getData().Search;
			oSelValue.openButtonEnable = false;
			this.getView().getModel("searchAndAdvancedSearchModelSet").refresh();
		},
		onPressLiveSearchField: function(oEvent) {
			var that = this;
			var sQuery = oEvent.getSource().getValue();
			var oBusyDialog = new sap.m.BusyDialog();
			oBusyDialog.open();
			// var Filter1 = new sap.ui.model.Filter('URL', 'EQ',
			// 	"/RESTAdapter/SmartSearch_Basic/MDM?q='" + sQuery + "'");
			var Filter1 = new sap.ui.model.Filter('URL', 'EQ',
				"/RESTAdapter/REST_BPM/TraceabilityReport?SearchTerm=" + sQuery);
			// RESTAdapter/REST_BPM/TraceabilityReport?SearchTerm=102569810
			this.oModel.read(
				"/BusinessPartnerSet", {
					method: "GET",
					filters: [Filter1],
					success: function(oData, oResponse) {
						oBusyDialog.close();
						var oSearchArray = [];
						if (oData.results[0].Response.includes("<h1>Error</h1>")) {
							var message = oData.results[0].Response.split("<pre>")[1].split("</pre>")[0];
							that.errMsg(message);
						} else {
							var oSearch = JSON.parse(oData.results[0].Response);
							if (oSearch["ProcessDetails"] === undefined) {
								oSearch = {
									ProcessDetails: []
								};
							}
							var oSResults = oSearch["ProcessDetails"];
							if (oSResults.length === undefined) {
								oSResults = Array(oSResults);
							}
							oSearchArray = oSResults;
						}
						that.searchtablemodel(oSearchArray);
					},
					error: function(oError) {
						oBusyDialog.close();
					}
				});
		},

		onPressAdvancedSearchSearchButton: function(oEvent) {
			//var oSelValueSearch = this.getView().getModel("searchAndAdvancedSearchModelSet").getData().Search;
			this.arrTmp = [];
			this.getView().getModel("searchAndAdvancedSearchModelSet").refresh();
			var oSearchFieldValue = this.getView().getModel("searchAndAdvancedSearchModelSet").getData().Search;
			oSearchFieldValue.SearchFieldValue = "";
			this.getView().getModel("searchAndAdvancedSearchModelSet").refresh();
			var oSelValue = this.getView().getModel("searchAndAdvancedSearchModelSet").getData().AdvancedSearch;

			var obj = {};
			obj.ReqID_From = oSelValue.ReqIDFrom;
			obj.ReqID_To = oSelValue.ReqIDTo;
			obj.GRID = oSelValue.GRID;
			obj.Kunnr = oSelValue.ApplicationID;
			obj.Account_Name = oSelValue.AccountName;
			obj.Requester = oSelValue.Requester;
			obj.Request_Status = oSelValue.RequestStatus;
			obj.Request_Type = oSelValue.RequestorType;
			obj.Priority = oSelValue.Priority;
			obj.Start_Date = oSelValue.StartDate;
			obj.End_Date = oSelValue.EndDate;
			obj.Country = oSelValue.Country;
			obj.System = oSelValue.System;
			obj.PartitionKey = oSelValue.PartitionKey;

			var that = this;
			var oBusyDialog = new sap.m.BusyDialog();
			oBusyDialog.open();

			var AdvancedSearchData = {
				"URL": "/RESTAdapter/REST_BPM/Customer_Details",
				"Request": JSON.stringify(obj)
			};
			this.oModel.create("/BusinessPartnerSet", AdvancedSearchData, {
				success: function(response) {
					oBusyDialog.close();
					that._oValueHelpDialogAS.close();
					var oSearch = JSON.parse(response.Response);
					var oSearchArray = [];
					if (response.Response.includes("<h1>Error</h1>")) {
						var message = response.Response.split("<pre>")[1].split("</pre>")[0];
						that.errMsg(message);
					} else {

						if (oSearch["ProcessDetails"] === undefined) {
							oSearch = {
								ProcessDetails: []
							};
						}
						var oSResults = oSearch["ProcessDetails"];
						if (oSResults.length === undefined) {
							oSResults = Array(oSResults);
						}
						oSearchArray = oSResults;
						that.arrTmp = oSResults;
						that.getView().byId("idLoadMore").data("PartitionKey", oSearch.partitionKey);
					}
					that.searchtablemodelAdvSrch(oSearchArray);
				},

				error: function(oError) {
					oBusyDialog.close();
				}
			});
			this.getView().getModel("searchAndAdvancedSearchModelSet").refresh();
		},
		OnPressLoadMore: function(oEvent) {
			var partitionKey = oEvent.getSource().data("PartitionKey");
			
			this.getView().getModel("searchAndAdvancedSearchModelSet").refresh();
			var oSearchFieldValue = this.getView().getModel("searchAndAdvancedSearchModelSet").getData().Search;
			oSearchFieldValue.SearchFieldValue = "";
			this.getView().getModel("searchAndAdvancedSearchModelSet").refresh();
			var oSelValue = this.getView().getModel("searchAndAdvancedSearchModelSet").getData().AdvancedSearch;

			var obj = {};
			obj.ReqID_From = oSelValue.ReqIDFrom;
			obj.ReqID_To = oSelValue.ReqIDTo;
			obj.GRID = oSelValue.GRID;
			obj.Kunnr = oSelValue.ApplicationID;
			obj.Account_Name = oSelValue.AccountName;
			obj.Requester = oSelValue.Requester;
			obj.Request_Status = oSelValue.RequestStatus;
			obj.Request_Type = oSelValue.RequestorType;
			obj.Priority = oSelValue.Priority;
			obj.Start_Date = oSelValue.StartDate;
			obj.End_Date = oSelValue.EndDate;
			obj.Country = oSelValue.Country;
			obj.System = oSelValue.System;
			obj.PartitionKey = partitionKey;

			var that = this;
			var oBusyDialog = new sap.m.BusyDialog();
			oBusyDialog.open();

			var AdvancedSearchData = {
				"URL": "/RESTAdapter/REST_BPM/Customer_Details",
				"Request": JSON.stringify(obj)
			};
			this.oModel.create("/BusinessPartnerSet", AdvancedSearchData, {
				success: function(response) {
					oBusyDialog.close();
					that._oValueHelpDialogAS.close();
					var oSearch = JSON.parse(response.Response);
					var oSearchArray = [];
					if (response.Response.includes("<h1>Error</h1>")) {
						var message = response.Response.split("<pre>")[1].split("</pre>")[0];
						that.errMsg(message);
					} else {

						if (oSearch["ProcessDetails"] === undefined) {
							oSearch = {
								ProcessDetails: []
							};
						}
						var oSResults = oSearch["ProcessDetails"];
						if (oSResults.length === undefined) {
							oSResults = Array(oSResults);
						}
						oSearchArray = that.arrTmp.concat(oSResults);
						that.getView().byId("idLoadMore").data("PartitionKey", oSearch.partitionKey);
					}
					that.searchtablemodelAdvSrch(oSearchArray);
					that.arrTmp = [];
				},

				error: function(oError) {
					oBusyDialog.close();
				}
			});
			this.getView().getModel("searchAndAdvancedSearchModelSet").refresh();
		},

		onPressSearchDataTableRow: function(oEvent) {
			var ind = oEvent.getSource().getSelectedIndex();
			if (ind >= 0) {
				//	var oA = [];
				//	var obj = oEvent.getParameters().rowContext.getObject();
				//	this.getView().setModel(obj, "searchTableModelSet");
				//	sap.ui.getCore().setModel(obj, "searchTableModelSet");
				this.getView().getModel("searchAndAdvancedSearchModelSet").refresh();
				var oSelValue = this.getView().getModel("searchAndAdvancedSearchModelSet").getData().Search;
				oSelValue.openButtonEnable = true;
				this.getView().getModel("searchAndAdvancedSearchModelSet").refresh();
			} else {
				var oSelValue1 = this.getView().getModel("searchAndAdvancedSearchModelSet").getData().Search;
				oSelValue1.openButtonEnable = false;
				this.getView().getModel("searchAndAdvancedSearchModelSet").refresh();
			}
		},

		onPressAdvancedSearchCloseButton: function() {
			this._oValueHelpDialogAS.close();
		},
		onExport: sap.m.Table.prototype.exportData || function() {
			var oModel = sap.ui.getCore().getModel("searchModelSet");
			this.i18nModel = this.getView().getModel("i18n");
			var oExport = new Export({
				exportType: new ExportTypeCSV({
					// //	separatorChar : ";"
					separatorChar: "\t",
					mimeType: "application/vnd.ms-excel",
					charset: "utf-8",
					fileExtension: "xls"
						// fileExtension: "csv",
						// separatorChar: ";"
				}),

				models: oModel,

				rows: {
					path: "/results"
				},
				columns: [{
						name: this.i18nModel.getProperty("RequestID"),
						template: {
							content: "{RequestID}"
						}
					}, {
						name: this.i18nModel.getProperty("Grid"),
						template: {
							content: "{Grid}"
						}
					}, {
						name: this.i18nModel.getProperty("AccountName"),
						template: {
							content: "{AccountName}"
						}
					}, {
						name: this.i18nModel.getProperty("RequName"),
						template: {
							content: "{RequestorCode1}"
						}
					}, {
						name: this.i18nModel.getProperty("RequEmail"),
						template: {
							content: "{RequestorEmail}"
						}
					}, {
						name: this.i18nModel.getProperty("Status"),
						template: {
							content: "{Status}"
						}
					},
					// {
					// 	name: this.i18nModel.getProperty("Type"),
					// 	template: {
					// 		content: "{Type}"
					// 	}
					// },
					{
						name: this.i18nModel.getProperty("StartData"),
						template: {
						//	content: "{path:'StartData',formatter:'Trace.model.Formatter.dateToStringForm'}"
							content: "{StartData}"
						}
					}, {
						name: this.i18nModel.getProperty("EndDate"),
						template: {
						//	content: "{path:'EndDate',formatter:'Trace.model.Formatter.dateToStringForm'}"
							content: "{EndDate}"
						}
					}
				]
			});
			oExport.saveFile().catch(function(oError) {
				sap.m.MessageBox.error("Error when downloading data. Browser might not be supported!\n\n" + oError);
			}).then(function() {
				oExport.destroy();
			});
		}

	});

});