sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"Trace/model/Formatter",
	"sap/ui/core/util/Export",
	"sap/ui/core/util/ExportTypeCSV",
	"sap/m/MessageBox"
], function(Controller, Formatter, Export, ExportTypeCSV) {
	"use strict";

	return Controller.extend("Trace.controller.Overview", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf Trace.view.Overview
		 */
		onInit: function() {
			this.oModel = this.getOwnerComponent().getModel("TraceReport");
			var router = sap.ui.core.UIComponent.getRouterFor(this);
			router.attachRoutePatternMatched(this._handleRouteMatched, this);
		},
		BackToTask: function() {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("RouteSearch", true);
		},
		_handleRouteMatched: function(oEvent) {
			if (oEvent.getParameter("name") === "Overview") {
				var Leve1Data = [];
				var DetailsData = [];
				var modelSearch = sap.ui.getCore().getModel("searchTableModelSet");
				Leve1Data.push(modelSearch);
				var oSModel = new sap.ui.model.json.JSONModel({
					"results": Leve1Data
				});
				this.getView().setModel(oSModel, "Level1");
				// DetailsData.push()                   )
				modelSearch.TaskDetails.sort(function(a, b) {
					var dateA = new Date(a.creation),
						dateB = new Date(b.creation);
					return dateA - dateB; //sort by date ascending
				});
				var DetailsModel = new sap.ui.model.json.JSONModel({
					"results": modelSearch.TaskDetails
				});
				this.getView().setModel(DetailsModel, "DetailsModel");
				if (modelSearch === undefined) {
					var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
					oRouter.navTo("searchCustomer", true);
					return;
				}
				//this.readDataHandleEachTimeAndAccountGrpChange();
				var AttachementData = sap.ui.getCore().getModel("AttachmentModelSet");
				if (AttachementData !== undefined) {
					if (modelSearch.attachment.length > 0) {
						//	this.GetAttachmentData(modelSearch.RequestID);
						this.GetAttachmentData(modelSearch.attachment[0].filename, modelSearch.RequestID);
						//	modelSearch.TaskDetails[0].taskAttachment
					}
				} else {
					if (modelSearch.attachment.length > 0) {
						//	this.GetAttachmentData(modelSearch.RequestID);
						this.GetAttachmentData(modelSearch.TaskDetails[0].taskAttachment, modelSearch.RequestID);
					}
				}

			}
		},
		onPressLinkGroup: function(oEvent) {
			var that = this;
			var OwnerModel = oEvent.getSource().getBindingContext("DetailsModel").getObject();
			var DetailsOwners = new sap.ui.model.json.JSONModel({
				"results": OwnerModel
			});
			// that.getView().setModel(DetailsOwners, "OwnerModelSet");    
			if (!that._oDialogGroup) {
				that._oDialogGroup = sap.ui.xmlfragment("Trace.Fragments.Group", that);
				// that._oDialog.bindElement(oEvent.getSource().getBindingContext("DetailsModel").getPath());
				that.getView().addDependent(this._oDialogGroup);
			}
			//this._oDialog.open();
			that._oDialogGroup.setModel(DetailsOwners, "OwnerModelSet");
			this._oDialogGroup.openBy(oEvent.getSource());
		},

		/*GetAttachmentData: function(RequestID) {
			var that = this;
			var oBusyDialog = new sap.m.BusyDialog();
			oBusyDialog.open();
			var Filter1 = new sap.ui.model.Filter('URL', 'EQ',
				"/RESTAdapter/Get_Attachment/AZURE_BLOB?RequestID=" + RequestID);
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
							// that.errMsg(message);
						} else {
							var oSearch = JSON.parse(oData.results[0].Response);
							var AttachmentJson = [];
							for (var i = 0; i < oSearch.UploadDocuments.length; i++) {
								var AttachementData = {
									"filename": oSearch.UploadDocuments[i].UploadedFiles.FileName,
									"Attachment": oSearch.UploadDocuments[i].DocumentUpload.Attachment,
									"FileType": oSearch.UploadDocuments[i].UploadedFiles.FileType
								};
								AttachmentJson.push(AttachementData);
							}
							var Attachment = new sap.ui.model.json.JSONModel({
								"RequestID": RequestID,
								"results": AttachmentJson
							});
							sap.ui.getCore().setModel(Attachment, "AttachmentModelSet");
							sap.ui.getCore().getModel("AttachmentModelSet").refresh();
						}
					},
					error: function(oError) {
						oBusyDialog.close();
					}
				});
		},*/
		GetAttachmentData: function(sUrl, RequestID, oEvent) {
			var that = this;
			
			var oSource = oEvent.getSource();

			var oLink = this.getView().byId("idLink");

			//	Below URL need to be updated with live one

			//	var url =
			//	"https://staeun1ntw01as.blob.core.windows.net/ntwrcontainer/MDMOpenCollab/Attachment/BP10000013_85cc56c7f81011ea9fc60000012b48fe?sp=racwl&st=2020-09-03T10:19:28Z&se=2021-02-01T10:19:00Z&sv=2019-12-12&sr=c&sig=APFd1KF2fl0PMxqdixj4WICRD5PsHUMl81%2Bl%2F1XITzs%3D"
			var url = sUrl;
			$.ajax({
				type: "GET",
				url: url,
				async: true,
				crossDomain: true,
				success: function(result, status, xhr) {

					if (result) {
						var AttachmentJson = [];
						for (var i = 0; i < result.UploadDocuments.length; i++) {
							var AttachementData = {
								"filename": result.UploadDocuments[i].UploadedFiles.FileName,
								"Attachment": result.UploadDocuments[i].DocumentUpload.Attachment,
								"FileType": result.UploadDocuments[i].UploadedFiles.FileType
							};
							AttachmentJson.push(AttachementData);
						}
						var Attachment = new sap.ui.model.json.JSONModel({
							"RequestID": RequestID,
							"results": AttachmentJson
						});
						sap.ui.getCore().setModel(Attachment, "AttachmentModelSet");
						sap.ui.getCore().getModel("AttachmentModelSet").refresh();
						if (!that._oDialogAttachments) {
							that._oDialogAttachments = sap.ui.xmlfragment("Trace.Fragments.Attachments", that);
							// that._oDialog.bindElement(oEvent.getSource().getBindingContext("DetailsModel").getPath());
							that.getView().addDependent(this._oDialogAttachments);
						}
						that._oDialogAttachments.openBy(oSource);

					}

				}
			});
		},

		onPressLinkAttachments: function(oEvent) {
			var that = this;
			var AttachmentModel = oEvent.getSource().getBindingContext("Level1").getObject();
			var sUrl = oEvent.getSource().getBindingContext("Level1").getObject().attachment[0].filename;
			var modelSearch = sap.ui.getCore().getModel("searchTableModelSet");

			this.GetAttachmentData(sUrl, modelSearch.RequestID, oEvent);

		},
		onPressLinkTaskAttachments: function(oEvent) {
			var that = this;

			var sUrl = oEvent.getSource().getBindingContext("DetailsModel").getObject().taskAttachment;
			var modelSearch = sap.ui.getCore().getModel("searchTableModelSet");

			this.GetAttachmentData(sUrl, modelSearch.RequestID, oEvent);

		

		},

		GetTaskAttachmentData: function(RequestID, oEvent, Instance) {
			var FInstance = Instance;
			var oEventFinal = oEvent.getSource();
			var that = this;
			var oBusyDialog = new sap.m.BusyDialog();
			oBusyDialog.open();
			var Filter1 = new sap.ui.model.Filter('URL', 'EQ',
				"/RESTAdapter/Get_Attachment/AZURE_BLOB?RequestID=" + RequestID);
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
							// that.errMsg(message);
						} else {
							var oSearch = JSON.parse(oData.results[0].Response);
							var AttachmentJson = [];
							for (var i = 0; i < oSearch.UploadDocuments.length; i++) {
								var AttachementData = {
									"filename": oSearch.UploadDocuments[i].UploadedFiles.FileName,
									"Attachment": oSearch.UploadDocuments[i].DocumentUpload.Attachment,
									"FileType": oSearch.UploadDocuments[i].UploadedFiles.FileType
								};
								AttachmentJson.push(AttachementData);
							}
							var Attachment = new sap.ui.model.json.JSONModel({
								"RequestID": RequestID,
								"results": AttachmentJson
							});
							sap.ui.getCore().setModel(Attachment, "TaskAttachmentModelSet");
							sap.ui.getCore().getModel("TaskAttachmentModelSet").refresh();

							if (!FInstance._oDialogTaskAttachments) {
								FInstance._oDialogTaskAttachments = sap.ui.xmlfragment("Trace.Fragments.TaskAttachments", FInstance);
								// that._oDialog.bindElement(oEvent.getSource().getBindingContext("DetailsModel").getPath());
								FInstance.getView().addDependent(FInstance._oDialogTaskAttachments);
							}
							//this._oDialog.open();
							var TaskAttachment = sap.ui.getCore().getModel("TaskAttachmentModelSet");
							FInstance._oDialogTaskAttachments.setModel(TaskAttachment, "TaskAttachmentModelSet");
							FInstance._oDialogTaskAttachments.openBy(oEventFinal);
						}
					},
					error: function(oError) {
						oBusyDialog.close();
					}
				});
		},
		onClickAttachment: function(oEvent) {
			var object = oEvent.getSource().getBindingContext("AttachmentModelSet").getObject();
			var base64 = object.Attachment; //shortend
			var sliceSize = 512;
			var byteCharacters = window.atob(base64); //method which converts base64 to binary
			var byteArrays = [];
			for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
				var slice = byteCharacters.slice(offset, offset + sliceSize);
				var byteNumbers = new Array(slice.length);
				for (var i = 0; i < slice.length; i++) {
					byteNumbers[i] = slice.charCodeAt(i);
				}
				var byteArray = new Uint8Array(byteNumbers);
				byteArrays.push(byteArray);
			}
			var blob = new Blob(byteArrays, {
				type: object.FileType
			}); //statement which creates the blob

			// var blobURL = URL.createObjectURL(blob);
			//	sap.m.URLHelper.redirect(blobURL, true);

			/*Code for file download with actual name*/
			var elem = window.document.createElement('a');
			elem.href = window.URL.createObjectURL(blob);
			elem.download = object.filename;
			document.body.appendChild(elem);
			elem.click();
			document.body.removeChild(elem);

		},
		onClickTaskAttachment: function(oEvent) {
			var object = oEvent.getSource().getBindingContext("TaskAttachmentModelSet").getObject();
			var base64 = object.Attachment; //shortend
			var sliceSize = 512;
			var byteCharacters = window.atob(base64); //method which converts base64 to binary
			var byteArrays = [];
			for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
				var slice = byteCharacters.slice(offset, offset + sliceSize);
				var byteNumbers = new Array(slice.length);
				for (var i = 0; i < slice.length; i++) {
					byteNumbers[i] = slice.charCodeAt(i);
				}
				var byteArray = new Uint8Array(byteNumbers);
				byteArrays.push(byteArray);
			}
			var blob = new Blob(byteArrays, {
				type: object.FileType
			}); //statement which creates the blob

			// var blobURL = URL.createObjectURL(blob);
			//	sap.m.URLHelper.redirect(blobURL, true);

			/*Code for file download with actual name*/
			var elem = window.document.createElement('a');
			elem.href = window.URL.createObjectURL(blob);
			elem.download = object.filename;
			document.body.appendChild(elem);
			elem.click();
			document.body.removeChild(elem);

		},
		onExport: sap.m.Table.prototype.exportData || function() {
			var oModel = this.getView().getModel("Level1");
			var spreadsheetModel = [];
			for (var i = 0; i < oModel.getData().results[0].TaskDetails.length; i++) {
				var spreadsheetdata = {
					"RequestID": oModel.getData().results[0].RequestID,
					"Grid": oModel.getData().results[0].Grid,
					"AccountName": oModel.getData().results[0].AccountName,
					"RequestorEmail": oModel.getData().results[0].RequestorEmail,
					"RequestorCode1": oModel.getData().results[0].RequestorCode1,
					"rcomment": oModel.getData().results[0].rcomment,
					"dcomment": oModel.getData().results[0].dcomment,
					"attachment": oModel.getData().results[0].attachment.length > 0 ? "Yes" : "No",
					"Status": oModel.getData().results[0].Status,
					"country": oModel.getData().results[0].country,
					"system": oModel.getData().results[0].system,
					"StartData": oModel.getData().results[0].StartData,
					"EndDate": oModel.getData().results[0].EndDate,
					"id": oModel.getData().results[0].TaskDetails[i].id,
					"TaskComments": oModel.getData().results[0].TaskDetails[i].taskComment,
					"group": oModel.getData().results[0].TaskDetails[i].group,
					"actual": oModel.getData().results[0].TaskDetails[i].actual,
					"taskattachment": oModel.getData().results[0].TaskDetails[i].taskAttachment,
					// "TaskAssToemail": "",
					"Taskstatus": oModel.getData().results[0].TaskDetails[i].status,
					// "expiration": oModel.getData().results[0].TaskDetails[i].expiration,
					"creation": oModel.getData().results[0].TaskDetails[i].creation,
					"completion": oModel.getData().results[0].TaskDetails[i].completion
				};
				spreadsheetModel.push(spreadsheetdata);
			}

			var oSModel = new sap.ui.model.json.JSONModel({
				"results": spreadsheetModel
			});
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

				models: oSModel,
				context: {
					application: "Supplier Invoices List",
					version: "6.1.0-SNAPSHOT",
					title: "Supplier Invoices",
					modifiedBy: "Doe, John",
					sheetName: "Invoices"
				},
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
						name: this.i18nModel.getProperty("RequestorComments"),
						template: {
							content: "{rcomment}"
						}
					}, {
						name: this.i18nModel.getProperty("DuplicateComments"),
						template: {
							content: "{dcomment}"
						}
					}, {
						name: this.i18nModel.getProperty("Attachments"),
						template: {
							content: "{attachment}"
						}
					}, {
						name: this.i18nModel.getProperty("RequestStatus"),
						template: {
							content: "{Status}"
						}
					}, {
						name: this.i18nModel.getProperty("Country"),
						template: {
							content: "{country}"
						}
					}, {
						name: this.i18nModel.getProperty("System"),
						template: {
							content: "{system}"
						}
					}, {
						name: this.i18nModel.getProperty("ReqStartData"),
						template: {
							content: "{path:'StartData',formatter:'Trace.model.Formatter.DateTimeConversionDDMMYYTime'}"
						}
					}, {
						name: this.i18nModel.getProperty("ReqEndDate"),
						template: {
							content: "{path:'EndDate',formatter:'Trace.model.Formatter.DateTimeConversionDDMMYYTime'}"
						}
					}, {
						name: this.i18nModel.getProperty("Taskid"),
						template: {
							content: "{id}"
						}
					}, {
						name: this.i18nModel.getProperty("TaskComments"),
						template: {
							content: "{TaskComments}"
						}
					}, {
						name: this.i18nModel.getProperty("TaskGrp"),
						template: {
							content: "{group}"
						}
					}, {
						name: this.i18nModel.getProperty("TaskAssTo"),
						template: {
							content: "{actual}"
						}
					}, {
						name: this.i18nModel.getProperty("TaskAttachments"),
						template: {
							content: "{taskattachment}"
						}
					},
					// {
					// 	name: this.i18nModel.getProperty("TaskAssToemail"),
					// 	template: {
					// 		content: "{TaskAssToemail}"
					// 	}
					// },
					{
						name: this.i18nModel.getProperty("TaskStat"),
						template: {
							content: "{Taskstatus}"
						}
					},
					// {
					// 	name: this.i18nModel.getProperty("TaskDue"),
					// 	template: {
					// 		content: "{path:'expiration',formatter:'Trace.model.Formatter.DateTimeConversionDDMMYYTime'}"
					// 	}
					// },
					{
						name: this.i18nModel.getProperty("TaskStart"),
						template: {
							content: "{path:'creation',formatter:'Trace.model.Formatter.DateTimeConversionDDMMYYTime'}"
						}
					}, {
						name: this.i18nModel.getProperty("Taskend"),
						template: {
							content: "{path:'completion',formatter:'Trace.model.Formatter.DateTimeConversionDDMMYYTime'}"
						}
					}
				]

			});
			oExport.saveFile().catch(function(oError) {
				sap.m.MessageBox.error("Error when downloading data. Browser might not be supported!\n\n" + oError);
			}).then(function() {
				oExport.destroy();
			});
		},

		//home page
		onCancelRequest: function() {
			window.location.href = '#Shell-home';
		}

	});

	/**
	 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
	 * (NOT before the first rendering! onInit() is used for that one!).
	 * @memberOf Trace.view.Overview
	 */
	//	onBeforeRendering: function() {
	//
	//	},

	/**
	 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
	 * This hook is the same one that SAPUI5 controls get after being rendered.
	 * @memberOf Trace.view.Overview
	 */
	//	onAfterRendering: function() {
	//
	//	},

	/**
	 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
	 * @memberOf Trace.view.Overview
	 */
	//	onExit: function() {
	//
	//	}

});