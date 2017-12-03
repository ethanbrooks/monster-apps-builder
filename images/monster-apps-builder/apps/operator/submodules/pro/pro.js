define(function(require) {
	var $ = require('jquery'),
		_ = require('lodash'),
		monster = require('monster'),
		toastr = require('toastr');

	var app = {

		requests: {},

		subscribe: {
		},

		hasProVersion: true,

		proBindBottomBarEvents: function(args) {
			var self = this,
				container = args.container,
				bottomBar = container.find('.bottom-bar');

			bottomBar.find('.feature').on('click', function() {
				var $this = $(this);

				if ($this.hasClass('filled')) {
					$this.toggleClass('active-fill');
				} else if (['mute', 'hold'].indexOf($this.data('feature')) < 0) {
					$this.toggleClass('active');
				}
			});

			bottomBar.find('.feature[data-feature="mute"]').on('click', function() {
				var $this = $(this),
					isMuted = $this.hasClass('active');

				if (isMuted) {
					monster.webphone.unmute();
				} else {
					monster.webphone.mute();
				}

				$this.toggleClass('active');
			});

			bottomBar.find('.feature[data-feature="hold"]').on('click', function() {
				var $this = $(this),
					isHold = $this.hasClass('active');

				if (isHold) {
					monster.webphone.unhold();
				} else {
					monster.webphone.hold();
				}
			});

			bottomBar.find('.hangup').on('click', function() {
				monster.webphone.hangup();
			});

			bottomBar.find('.toggle-webphone .monster-switch .switch-state').on('change', function(e) {
				var $toggle = $(this),
					$switch = $(this).parents('.monster-switch');/*,
					showOnCallActions = function($container) {
						var $actions = $container.find('.webphone-actions');

						$actions.removeClass('ringing');
						$actions.show();
						$container.find('.quickcall-button').hide();
					},
					hideOnCallActions = function($container) {
						var $actions = $container.find('.webphone-actions');

						$actions.removeClass('ringing');
						$actions.find('.feature').removeClass('active active-fill');
						$('.oncall-dialpad-popover').removeClass('drop-open');
						$container.find('.quickcall-button').show();
						$actions.hide();
					}*/

				if (!$switch.hasClass('disabled')) {
					$switch.addClass('disabled');

					if ($toggle.prop('checked')) {
						monster.webphone.login({
							onConnected: function(device) {
								$toggle.prop('checked', true);
								$toggle.parents('.monster-switch').removeClass('disabled');

								device.isWebphone = true;
								device.cssClass = 'icon-telicon-soft-phone';
								self.proAddWebphoneToList(device);

								toastr.success(self.i18n.active().operatorApp.pro.webphoneConnected);
							},
							onError: function() {
								toastr.error(self.i18n.active().operatorApp.pro.noWebphoneAllowed);
								$toggle.prop('checked', false);
								$toggle.parents('.monster-switch').removeClass('disabled');
								self.proRemoveWebphonesFromList();
							},
							onIncoming: function(call) {
								var data = {
									deviceId: monster.webphone.device.id,
									formatted: {
										callId: call.callId,
										callee: {
											label: monster.webphone.device.name,
											id: monster.webphone.device.id
										},
										caller: {
											label: call.callerName
										},
										direction: 'inbound',
										elapsedTime: 0,
										event: 'ringing',
										isWebphone: true,
										webphone: {
											countActiveCalls: monster.webphone.listCalls().length,
											call: call,
											callbacks: {
												triggerAccept: function() {
													// we have to get the global selector, because if the app is refreshed, the reference to bottomBar will not work if we keep the same variable
													/*var $bottomBar = $('.operator-app-container .bottom-bar');

													call.accept();

													$bottomBar.find('.phone-number').html(call.callerNumber);
													$bottomBar.find('.timer').html(self.i18n.active().operatorApp.pro.waitMediaShared);
													showOnCallActions($bottomBar);*/

													call.accept();
													self.proRefreshWebphoneCalls();
												},
												triggerReject: function() {
													//call.reject();
													call.reject();
													self.proRefreshWebphoneCalls();
												}
											}
										}
									}
								};

								var newArgs = $.extend({}, args, { data: data });
								/* TODO SHOULD CALL THE RENDER CALL ELEMENT, NOT THE PAINT ELEMENT */
								monster.pub('operator.paintCall', newArgs);
							},
							onHangup: function() {
								//hideOnCallActions($('.operator-app-container .bottom-bar'));
								self.proRefreshWebphoneCalls();
							},
							onCancel: function() {
								//hideOnCallActions($('.operator-app-container .bottom-bar'));
								self.proRefreshWebphoneCalls();
							},
							onAccepted: function() {
								/*var $container = $('.operator-app-container .bottom-bar'),
									$actions = $container.find('.webphone-actions');

								showOnCallActions($container);
								monster.ui.timer($actions.find('.timer'), 0);*/

								self.proRefreshWebphoneCalls();
							},
							onHold: function() {
								//$('.call-element[data-id="' + channelId + '"]').addClass('hold');

								self.proRefreshWebphoneCalls();
							},
							onUnhold: function() {
								//$('.call-element[data-id="' + channelId + '"]').removeClass('hold');

								self.proRefreshWebphoneCalls();
							}
						});
					} else {
						self.proDisconnectWebphone();

						$switch.removeClass('disabled');
					}
				} else {
					// if the switch was disabled, we revert the property to stay at its current value
					$toggle.prop('checked', !$toggle.prop('checked'));
				}
			});
		},

		proRefreshWebphoneCalls: function($bottomBar) {
			var self = this,
				$container = $bottomBar || $('.operator-app-container .bottom-bar'),
				$actions = $container.find('.webphone-actions'),
				showOnCallActions = function($container) {
					var $actions = $container.find('.webphone-actions');

					$actions.removeClass('ringing');
					$actions.show();
					$container.find('.quickcall-button').hide();
				},
				hideOnCallActions = function($container) {
					var $actions = $container.find('.webphone-actions');

					$actions.removeClass('ringing');
					$actions.find('.feature').removeClass('active active-fill');
					$('.oncall-dialpad-popover').removeClass('drop-open');
					$container.find('.quickcall-button').show();
					$actions.hide();
				},
				addTimer = function(duration) {
					if (self.appFlags.hasOwnProperty('proBottomBarTimer') && self.appFlags.proBottomBarTimer) {
						clearInterval(self.appFlags.proBottomBarTimer);
					}

					var timer = monster.ui.timer($actions.find('.timer'), duration);

					self.appFlags.proBottomBarTimer = timer;
				},
				activeCall = monster.webphone.getActiveCall();

			if (activeCall) {
				showOnCallActions($container);

				if (activeCall.status === 'ringing') {
					$actions.find('.timer').hide();
					$actions.find('.ringing-text').show();
				} else {
					$actions.find('.ringing-text').hide();
					$actions.find('.timer').show();

					addTimer(activeCall.acceptedDuration);
				}

				$container.find('.phone-number').html(activeCall.callerIdName);

				$container.find('[data-feature="hold"]').toggleClass('active', activeCall.isOnHold);
				$container.find('[data-feature="mute"]').toggleClass('active', activeCall.isMuted);
			} else {
				hideOnCallActions($container);
			}
		},

		proAddCallToBottomBar: function() {
			var $container = $('.operator-app-container .bottom-bar'),
				$actions = $container.find('.webphone-actions'),
				showOnCallActions = function($container) {
					var $actions = $container.find('.webphone-actions');

					$actions.removeClass('ringing');
					$actions.show();
					$container.find('.quickcall-button').hide();
				};/*,
				hideOnCallActions = function($container) {
					var $actions = $container.find('.webphone-actions');

					$actions.removeClass('ringing');
					$actions.find('.feature').removeClass('active active-fill');
					$('.oncall-dialpad-popover').removeClass('drop-open');
					$container.find('.quickcall-button').show();
					$actions.hide();
				};*/

			showOnCallActions($container);
			monster.ui.timer($actions.find('.timer'), 0);
		},

		proAddWebphoneToList: function(device) {
			var self = this,
				$deviceList = $('.quickcall-popover-content').find('.devices-list');

			self.appFlags.availableDevices.push(device);

			$deviceList.append(monster.template(self, 'pro-quickcall-device', device));
			$deviceList.removeClass('empty');
		},

		proDisconnectWebphone: function() {
			var self = this;

			self.proRemoveWebphonesFromList();

			monster.webphone.logout();
		},

		proRemoveWebphonesFromList: function() {
			var self = this,
				$deviceList = $('.quickcall-popover-content').find('.devices-list'),
				newList = [];

			_.each(self.appFlags.availableDevices, function(device) {
				if (!(device.hasOwnProperty('isWebphone') && device.isWebphone)) {
					newList.push(device);
				}
			});

			self.appFlags.availableDevices = newList;

			$deviceList.find('.device.webphone').remove();
			if ($deviceList.find('li:not(.empty)').length === 0) {
				$deviceList.addClass('empty');
			}
		},

		proPaintCallDevices: function(target) {
			var self = this,
				devices = self.appFlags.availableDevices;

			if (devices.length) {
				target.removeClass('empty');

				_.each(devices, function(device) {
					target.append(monster.template(self, 'pro-quickcall-device', device));
				});
			} else {
				target.addClass('empty');
			}
		},

		proDialpadOnCallPopover: function(parent) {
			var self = this,
				dialpad = monster.ui.dialpad({
					onDtmfClick: function(dtmf, inputValue) {
						monster.webphone.sendDTMF(dtmf);
					}
				}),
				popover = monster.ui.popover({
					target: parent.find('.action-block[data-feature="dialpad"]'),
					content: dialpad,
					dropOptions: {
						classes: 'oncall-dialpad-popover',
						tetherOptions: {
							attachment: 'bottom center',
							targetAttachment: 'top center'
						}
					}
				});

			popover.on('close', function() {
				dialpad.find('.dialbox').val('');
			});
		},

		proPlaceCall: function($device, destination, afterCallPlaced) {
			var self = this,
				isWebphone = $device.hasClass('webphone'),
				parent = $('#operator_app_container');

			if (isWebphone) {
				monster.webphone.connect(destination);
				parent.find('.webphone-actions .phone-number').html(destination);
				parent.find('.webphone-actions').show();
				parent.find('.quickcall-button').hide();
				parent.find('.webphone-actions').addClass('ringing');
				$('.tooltip').hide();

				toastr.success(monster.template(self, '!' + self.i18n.active().operatorApp.pro.quickCallPopover.successConnect, { device: $device.data('name'), destination: destination }));

				afterCallPlaced && afterCallPlaced();
			} else {
				self.proPlaceQuickCall($device.data('id'), destination, function(data) {
					toastr.success(monster.template(self, '!' + self.i18n.active().operatorApp.pro.quickCallPopover.successConnect, { device: $device.data('name'), destination: destination }));

					afterCallPlaced();
				});
			}
		},

		proQuickCallPopover: function(parent, data) {
			var self = this,
				popoverTemplate = $(monster.template(self, 'pro-quickcall-popover')),
				popoverQuickCall;

			monster.ui.tooltips(popoverTemplate, {
				options: {
					container: 'body'
				}
			});

			self.proPaintCallDevices(popoverTemplate.find('.devices-list'));

			popoverTemplate.find('.devices-list').on('click', '.device', function() {
				var $destination = popoverTemplate.find('#quickcall_number');

				self.proPlaceCall($(this), $destination.val(), function() {
					$destination.val('');
					popoverQuickCall.close();
				});
			});

			var dialpad = monster.ui.dialpad({
				onDtmfClick: function(dtmf, inputValue) {
					popoverTemplate
						.find('#quickcall_number')
							.val(inputValue);
				},
				onBackSpaceClick: function(inputValue) {
					popoverTemplate
						.find('#quickcall_number')
							.val(inputValue);
				}
			});

			popoverTemplate.find('.dialpad-quickcall').on('click', function() {
				dialpad.find('.dialbox').val(popoverTemplate.find('#quickcall_number').val());
			});

			monster.ui.popover({
				removeTarget: parent.find('.quickcall-button'),
				target: popoverTemplate.find('.dialpad-quickcall'),
				content: dialpad,
				dropOptions: {
					classes: 'dialpad-quickcall-popover',
					tetherOptions: {
						targetAttachment: 'middle right',
						attachment: 'middle left'
					}
				}
			});

			popoverQuickCall = monster.ui.popover({
				target: parent.find('.quickcall-button'),
				title: self.i18n.active().operatorApp.pro.quickCallPopover.title,
				content: popoverTemplate,
				dropOptions: {
					openOn: 'always',
					remove: false,
					classes: 'open-quickcall-popover',
					tetherOptions: {
						targetAttachment: 'top left',
						attachment: 'bottom left'
					}
				}
			});

			// The popover needs to be in the DOM when we start the application (so we can add the webphone to the list of devices when they turn on the toggle)
			// If we don't load it first, then when they enable the webphone, the list of devices won't include it.
			// TODO: Change this to have the list of webphone always in the popover, but with a class to enable/disable them
			var firstTime = true;
			popoverQuickCall.on('open', function() {
				if (firstTime) {
					firstTime = false;
					popoverQuickCall.close();
				}
			});

			parent.find('.quickcall-button').on('click', function() {
				popoverQuickCall.toggle();
			});
		},

		proPaintMainTemplate: function($template, data) {
			var self = this,
				dataTemplate = {
					hasWebphone: monster.config.api.hasOwnProperty('socketWebphone'),
					isWebphoneConnected: monster.webphone.isConnected()
				},
				bottomBarTemplate = $(monster.template(self, 'pro-bottom-bar', dataTemplate));

			$template.addClass('pro-version');

			self.proQuickCallPopover(bottomBarTemplate, data);
			self.proDialpadOnCallPopover(bottomBarTemplate);

			monster.ui.tooltips(bottomBarTemplate, {
				options: {
					container: 'body'
				}
			});

			$template.append(bottomBarTemplate);

			self.proRefreshWebphoneCalls(bottomBarTemplate);
		},

		proAfterShowOverlay: function() {
			var self = this;

			$('#operator_app_container .bottom-bar').addClass('overlay-on');
			$('.powered-by, #atlwdg-trigger').hide();
		},

		proAfterRemoveOverlay: function() {
			var self = this;

			$('.feature-activated').removeClass('feature-activated');

			$('.is-transfering').removeClass('is-transfering');
			$('.is-parking').removeClass('is-parking');
			$('.is-retrieving').removeClass('is-retrieving');

			delete self.appFlags.transfer;
			delete self.appFlags.unpark;
			delete self.appFlags.park;

			$('#operator_app_container .bottom-bar').removeClass('overlay-on');
			$('.powered-by, #atlwdg-trigger').show();
		},

		proAddEntityActions: function(template) {
			var self = this,
				parent = $('#operator_app_container'),
				$actions = $(monster.template(self, 'pro-actions-entities')),
				argsOverlay = {
					cssToExclude: template,
					afterShow: function() {
						self.proAfterShowOverlay();
					},
					afterHide: function() {
						self.proAfterRemoveOverlay();
					}
				};

			//bindings
			template.on('click', function(e) {
				if (self.appFlags.hasOwnProperty('transfer')) {
					self.proTransferChannel(self.appFlags.transfer.channel, template.data('presence-id'), argsOverlay);
				} else if (self.appFlags.hasOwnProperty('unpark')) {
					self.proUnparkChannel(self.appFlags.unpark.channel, template.data('presence-id'), argsOverlay);
				} else if (!template.hasClass('action-state') && !$(e.target).hasClass('cancel')) {
					// remove all other clicked entities
					parent.find('.entities-listing .action-state').removeClass('action-state');

					template.addClass('action-state');

					monster.ui.overlay.show(argsOverlay);
				}
			});

			$actions.find('.cancel').on('click', function(e) {
				template.removeClass('action-state');

				monster.ui.overlay.hide(argsOverlay);
			});

			$actions.find('.call').on('click', function(e) {
				self.proShowPopoverQuickCallEntity(template, template.data('presence-id'));
			});

			template.append($actions);
		},

		proGetCallEntityTemplate: function(popover) {
			var self = this,
				template = $(monster.template(self, 'pro-quickcall-popover-entity'));

			self.proPaintCallDevices(template.find('.devices-list'));

			monster.ui.tooltips(template, {
				options: {
					container: 'body'
				}
			});

			return template;
		},

		// We create a popover each time because the content changes, the list of device specifically.
		proShowPopoverQuickCallEntity: function(target, destination) {
			var self = this,
				popover,
				template = self.proGetCallEntityTemplate();

			template.find('.devices-list .device').on('click', function() {
				self.proPlaceCall($(this), destination, function() {
					target.removeClass('action-state');
					popover.close();
				});
			});

			popover = monster.ui.popover({
				target: target.find('.call'),
				content: template,
				mode: 'showOnceOnClick',
				dropOptions: {
					classes: 'call-device-popover',
					tetherOptions: {
						attachment: 'bottom center',
						targetAttachment: 'top center'
					}
				}
			});
		},

		proPlaceQuickCall: function(deviceId, number, callback) {
			var self = this;

			if (number) {
				self.callApi({
					resource: 'device.quickcall',
					data: {
						accountId: self.accountId,
						deviceId: deviceId,
						number: number
					},
					success: function(data) {
						callback && callback(data);
					}
				});
			} else {
				toastr.error(self.i18n.active().operatorApp.pro.quickCallPopover.invalidQuickcallNumber);
			}
		},

		proGetRegisteredDevices: function(callback) {
			var self = this;

			self.callApi({
				resource: 'device.getStatus',
				data: {
					accountId: self.accountId
				},
				success: function(devices) {
					callback && callback(devices.data);
				}
			});
		},

		proGetUserDevices: function(callback) {
			var self = this;

			self.callApi({
				resource: 'device.list',
				data: {
					accountId: self.accountId,
					filters: {
						filter_owner_id: self.userId
					}
				},
				success: function(devices) {
					callback && callback(devices.data);
				}
			});
		},

		proGetDashboardData: function(data, globalCallback) {
			var self = this;

			monster.parallel({
				devices: function(callback) {
					self.proGetUserDevices(function(devices) {
						callback && callback(null, devices);
					});
				},
				status: function(callback) {
					self.proGetRegisteredDevices(function(registeredDevices) {
						callback && callback(null, registeredDevices);
					});
				},
				userWebphones: function(callback) {
					monster.pub('common.webphone.getUserDevices', function(devices) {
						callback && callback(null, devices);
					});
				}
			},
			function(err, proData) {
				var formattedProData = self.proFormatDashboardData(proData);

				self.appFlags.availableDevices = formattedProData.devices;

				data.proData = formattedProData;

				globalCallback && globalCallback(data);
			});
		},

		proFormatDashboardData: function(proData) {
			var self = this,
				registeredDevices = _.keyBy(proData.status, 'device_id'),
				webphoneDevices = _.keyBy(proData.userWebphones, 'id'),
				quickCallDevices = [],
				formattedProData = {},
				isConnected = monster.webphone.isConnected(),
				mapIconClass = {
					cellphone: 'fa fa-phone',
					smartphone: 'icon-telicon-mobile-phone',
					landline: 'icon-telicon-home',
					mobile: 'icon-telicon-sprint-phone',
					softphone: 'icon-telicon-soft-phone',
					sip_device: 'icon-telicon-voip-phone',
					sip_uri: 'icon-telicon-voip-phone',
					fax: 'icon-telicon-fax',
					ata: 'icon-telicon-ata'
				},
				isWebphone;

			_.each(proData.devices, function(device) {
				isWebphone = webphoneDevices.hasOwnProperty(device.id);

				if (isWebphone) {
					device.isWebphone = true;
					device.cssClass = 'icon-telicon-soft-phone';
				} else {
					device.cssClass = mapIconClass[device.device_type];
				}

				// we only add webphones if we're currently connected to the webphone
				if (registeredDevices.hasOwnProperty(device.id) && (!isWebphone || isConnected)) {
					quickCallDevices.push(device);
				}
			});

			formattedProData.devices = quickCallDevices;

			return formattedProData;
		},

		proRenderCallElementActions: function(mainTemplate, data) {
			var self = this,
				template = $(monster.template(self, 'pro-call-element-actions', { data: data })),
				channelId = mainTemplate.data('id'),
				popoverTransfer,
				popoverUnpark,
				popoverPark;

			template.find('[data-action="retrieve"]').on('click', function() {
				monster.webphone.holdAll();
				monster.webphone.unhold(channelId);
				//self.proRefreshWebphoneCalls();
			});

			template.find('[data-action="pickup"]').on('click', function() {
				if (data.hasOwnProperty('webphone')) {
					data.webphone.callbacks.triggerAccept();
				}
			});

			template.find('[data-action="hold-accept"]').on('click', function() {
				if (data.hasOwnProperty('webphone')) {
					monster.webphone.holdAll(channelId);

					data.webphone.callbacks.triggerAccept();
				}
			});

			template.find('[data-action="hangup-accept"]').on('click', function() {
				if (data.hasOwnProperty('webphone')) {
					monster.webphone.hangupAll(channelId);

					data.webphone.callbacks.triggerAccept();
				}
			});

			template.find('[data-action="ignore"]').on('click', function() {
				if (data.hasOwnProperty('webphone')) {
					data.webphone.callbacks.triggerReject();

					$('.call-element[data-id="' + channelId + '"]').remove();
				}
			});

			template.find('[data-action="hangup"]').on('click', function() {
				if (!mainTemplate.hasClass('feature-activated')) {
					self.proHangupChannel(channelId);
				}
			});

			template.find('[data-action="hold"]').on('click', function() {
				if (!mainTemplate.hasClass('feature-activated')) {
					var $this = $(this);

					self.proToggleHoldChannel(channelId);

					$this.toggleClass('active');
					$this.parents('.call-element').toggleClass('hold').find('.status-label');
				}
			});

			template.find('[data-action="transfer"]').on('click', function() {
				var argsOverlay = {
					cssToExclude: [$(this).parents('.call-element'), $('.call-transfer-popover'), $('#entities')],
					afterShow: function() {
						self.appFlags.transfer = {
							channel: channelId,
							popover: popoverTransfer
						};

						self.proAfterShowOverlay();
					},
					afterHide: function() {
						self.proAfterRemoveOverlay();
					},
					onClick: function() {
						popoverTransfer.toggle();
					}
				};

				if (mainTemplate.hasClass('is-transfering')) {
					popoverTransfer.close();

					monster.ui.overlay.hide(argsOverlay);
				} else if (!mainTemplate.hasClass('feature-activated')) {
					if (popoverTransfer) {
						popoverTransfer.open();
					} else {
						popoverTransfer = self.proTransferPopover($(this), channelId, argsOverlay);
					}

					mainTemplate.addClass('feature-activated is-transfering');
					monster.ui.overlay.show(argsOverlay);
				}
			});

			template.find('[data-action="unpark"]').on('click', function() {
				var argsOverlay = {
					cssToExclude: [$(this).parents('.call-element'), $('.call-unpark-popover'), $('#entities')],
					afterShow: function() {
						self.appFlags.unpark = {
							channel: channelId,
							popover: popoverUnpark
						};

						self.proAfterShowOverlay();
					},
					afterHide: function() {
						self.proAfterRemoveOverlay();
					},
					onClick: function() {
						popoverUnpark.toggle();
					}
				};

				if (mainTemplate.hasClass('is-retrieving')) {
					popoverUnpark.close();

					monster.ui.overlay.hide(argsOverlay);
				} else if (!mainTemplate.hasClass('feature-activated')) {
					if (popoverUnpark) {
						popoverUnpark.open();
					} else {
						popoverUnpark = self.proUnparkPopover($(this), channelId, argsOverlay);
					}

					mainTemplate.addClass('feature-activated is-retrieving');
					monster.ui.overlay.show(argsOverlay);
				}
			});

			template.find('[data-action="park"]').on('click', function() {
				var argsOverlay = {
					cssToExclude: [$(this).parents('.call-element'), $('.call-park-popover')],
					afterShow: function() {
						self.appFlags.park = {
							channel: channelId,
							popover: popoverPark
						};

						self.proAfterShowOverlay();
					},
					afterHide: function() {
						self.proAfterRemoveOverlay();
					},
					onClick: function() {
						popoverPark.toggle();
					}
				};

				if (mainTemplate.hasClass('is-parking')) {
					popoverPark.close();

					monster.ui.overlay.hide(argsOverlay);
				} else if (!mainTemplate.hasClass('feature-activated')) {
					mainTemplate.addClass('feature-activated is-parking');
					monster.ui.overlay.show(argsOverlay);

					if (popoverPark) {
						popoverPark.open();
					} else {
						popoverPark = self.proParkPopover($(this), channelId, argsOverlay);
					}
				}
			});

			mainTemplate.append(template);

			mainTemplate.find('.call-element-content').on('click', function(e) {
				if (!$(this).parents('.feature-activated').length) {
					var $this = $(this),
						isSelected = $this.parent('.call-element').hasClass('selected');

					e.preventDefault();

					$this.parents('section')
						.find('.call-element')
							.removeClass('selected');

					$this.parent('.call-element')
						.toggleClass('selected', !isSelected);
				}
			});

			return mainTemplate;
		},

		proTransferPopover: function(target, callId, argsOverlay) {
			var self = this,
				dialpad = monster.ui.dialpad({
					button: {
						text: self.i18n.active().operatorApp.pro.transfer,
						class: 'monster-button-success',
						onClick: function(inputValue) {
							self.proTransferChannel(callId, inputValue, argsOverlay);
						}
					}
				}),
				popover = monster.ui.popover({
					target: target,
					content: dialpad,
					dropOptions: {
						classes: 'call-transfer-popover',
						openOn: 'always',
						remove: false,
						tetherOptions: {
							attachment: 'top left',
							targetAttachment: 'bottom left'
						}
					}
				});

			return popover;
		},

		proUnparkPopover: function(target, callId, argsOverlay) {
			var self = this,
				dialpad = monster.ui.dialpad({
					button: {
						text: self.i18n.active().operatorApp.pro.retrieve,
						class: 'monster-button-success',
						onClick: function(inputValue) {
							self.proUnparkChannel(callId, inputValue, argsOverlay);
						}
					}
				}),
				popover = monster.ui.popover({
					target: target,
					content: dialpad,
					dropOptions: {
						classes: 'call-unpark-popover',
						openOn: 'always',
						remove: false,
						tetherOptions: {
							attachment: 'top left',
							targetAttachment: 'bottom left'
						}
					}
				});

			return popover;
		},

		proParkPopover: function(target, callId, argsOverlay) {
			var self = this,
				dialpad = monster.ui.dialpad({
					headline: self.i18n.active().operatorApp.pro.parkingPopover.headline,
					hideKeys: true,
					button: {
						text: self.i18n.active().operatorApp.pro.parkingPopover.park,
						class: 'monster-button-warning',
						onClick: function(inputValue) {
							self.proParkChannel(callId, inputValue);

							popover.close();

							monster.ui.overlay.hide(argsOverlay);
						}
					}
				}),
				popover = monster.ui.popover({
					target: target,
					content: dialpad,
					dropOptions: {
						classes: 'call-park-popover',
						openOn: 'always',
						remove: false,
						tetherOptions: {
							attachment: 'top left',
							targetAttachment: 'bottom left'
						}
					}
				});

			return popover;
		},

		proTransferChannel: function(callId, destination, argsOverlay, callback) {
			var self = this,
				data = {
					module: 'transfer',
					data: {
						target: destination += '',
						'Transfer-Type': 'blind',
						leg: 'bleg'
					}
				};

			self.appFlags.transfer.popover.close();

			self.proActionChannel(callId, data, callback);

			monster.ui.overlay.hide(argsOverlay);
		},

		proParkChannel: function(callId, destination, callback) {
			var self = this,
				data = {
					module: 'transfer',
					data: {
						target: '*3' + destination,
						'Transfer-Type': 'blind',
						leg: 'bleg'
					}
				};

			self.proActionChannel(callId, data, callback);
		},

		proUnparkChannel: function(callId, destination, argsOverlay, callback) {
			var self = this,
				data = {
					module: 'intercept',
					data: {
						target_type: 'number',
						target_id: destination += ''
					}
				};

			self.appFlags.unpark.popover.close();

			self.proActionChannel(callId, data, callback);

			monster.ui.overlay.hide(argsOverlay);
		},

		proHangupChannel: function(callId, callback) {
			var self = this,
				data = {
					module: 'hangup'
				};

			self.proActionChannel(callId, data, callback);
		},

		proTTSChannel: function(callId, callback) {
			var self = this,
				data = {
					module: 'tts',
					data: {
						text: 'you are awesome'
					}
				};

			self.proActionChannel(callId, data, callback);
		},

		proToggleHoldChannel: function(callId, callback) {
			var self = this,
				data = {
					module: 'hold_control'
					/*data: {
						action: 'toggle'
					}*/
				};

			self.proActionChannel(callId, data, callback);
		},

		proActionChannel: function(callId, data, callback) {
			var self = this;

			self.callApi({
				resource: 'channel.action',
				data: {
					accountId: self.accountId,
					callId: callId,
					data: data,
					envelopeKeys: {
						action: 'metaflow'
					}
				},
				success: function(data) {
					callback && callback(data.data);
				}
			});
		}
	};

	return app;
});
