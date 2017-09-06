'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _eventKit = require('event-kit');

var _CommandEvent = require('./CommandEvent');

var _CommandEvent2 = _interopRequireDefault(_CommandEvent);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var KeymapManager = function () {
	_createClass(KeymapManager, null, [{
		key: 'buildKeyDownEvent',
		value: function buildKeyDownEvent(key, options) {
			keydownEvent(key, options);
		}
	}, {
		key: 'buildKeyUpEvent',
		value: function buildKeyUpEvent(key, options) {
			keydownEvent(key, options);
		}
	}]);

	function KeymapManager() {
		var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

		_classCallCheck(this, KeymapManager);

		this.partialMatchTimeout = 1000;
		this.defaultTarget = null;
		this.pendingPartialMatches = null;
		this.pendingStateTimeoutHandle = null;

		this.watchSubscriptions = {};
		this.customKeystrokeResolvers = [];
		this.clear();
	}

	_createClass(KeymapManager, [{
		key: 'clear',
		value: function clear() {
			this.emitter = new _eventKit.Emitter();
			this.keyBindings = [];
			this.queuedKeyboardEvents = [];
			this.queuedKeyStrokes = [];
			this.bindingsToDisable = [];
		}
	}, {
		key: 'onDidMatchBinding',
		value: function onDidMatchBinding(callback) {
			this.emitter.on('did-match-binding', callback);
		}
	}, {
		key: 'onDidPartiallyMatchBinding',
		value: function onDidPartiallyMatchBinding(callback) {
			this.emitter.on('did-partially-match-binding', callback);
		}
	}, {
		key: 'onDidFailToMatchBinding',
		value: function onDidFailToMatchBinding(callback) {
			this.emitter.on('did-fail-to-match-binding', callback);
		}
	}, {
		key: 'onDidReloadKeymap',
		value: function onDidReloadKeymap(callback) {
			this.emitter.on('did-reload-keymap', callback);
		}
	}, {
		key: 'onDidUnloadKeymap',
		value: function onDidUnloadKeymap(callback) {
			this.emitter.on('did-unload-keymap', callback);
		}
	}, {
		key: 'onDidFailToReadFile',
		value: function onDidFailToReadFile(callback) {
			this.emitter.on('did-fail-to-read-file', callback);
		}
	}, {
		key: 'build',
		value: function build(source, keyBindingsBySelector) {
			var priority = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
			var throwOnInvalidSelector = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;

			var bindings = [];

			_lodash2.default.each(keyBindingsBySelector, function (keyBindings, selector) {

				if (throwOnInvalidSelector && !isSelectorValid(selector.valid(/!important/g, ''))) {
					console.warn('Encountered an invalid selector adding key bindings from \'' + source + '\': \'' + selector + '\'');
					return;
				}

				if (!_lodash2.default.isObject(keyBindings)) {
					console.warn('Encountered an invalid selector adding key bindings from \'' + source + '\': \'' + selector + '\'');
				}

				_lodash2.default.each(keyBindings, function (keystrokes, command) {
					command = command.toString() || '';

					if (command.length === 0) {
						console.warn('Empty command for binding: ' + selector + ' ' + keystrokes + ' in ' + source);
						return;
					}

					var normalizedKeystrokes = normalizedKeystrokes(keystrokes);
					if (normalizedKeystrokes) {
						bindings.push(new KeyBinding(source, command, normalizedKeystrokes, selector, priority));
					} else {
						console.warn('Invalid keystroke sequence for binding: ' + keystrokes + ': ' + command + ' in ' + source);
					}

					return bindings;
				});
			});
		}
	}, {
		key: 'add',
		value: function add(source) {
			var _keyBindings,
			    _this = this;

			var priority = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
			var throwOnInvalidSelector = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

			var addedKeyBindings = this.build(source, keyBindingsBySelector, priority, throwOnInvalidSelector);

			(_keyBindings = this.keyBindings).push.apply(_keyBindings, _toConsumableArray(addedKeyBindings));

			new _eventKit.Disposable(function () {
				for (keyBinding in addedKeyBindings) {
					var index = _this.keyBindings.indexOf(keyBinding);
					if (index === -1) {
						_this.keyBindings.splice(index, 1);
					}
				}
				return;
			});
		}
	}, {
		key: 'removeBindingsFromSource',
		value: function removeBindingsFromSource(source) {
			this.keyBindings = this.keyBindings.filter(function (keybinding) {
				return keybinding.source !== source;
			});
		}
	}, {
		key: 'getKeyBindings',
		value: function getKeyBindings() {
			return this.keyBindings.slice();
		}
	}, {
		key: 'loadKeymap',
		value: function loadKeymap(bindingsPath) {
			var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

			this.add(keymap, options.priority);
		}
	}, {
		key: 'handleKeyboardEvent',
		value: function handleKeyboardEvent(event) {
			if (event.keyCode === 229 && event.key !== 'Dead') {
				return;
			}

			var keystroke = this.keystrokeForKeyboardEvent(event);

			if (event.type === 'keydown' && this.queuedKeyStrokes.length > 0 && isBareModifier(keystroke)) {
				event.preventDefault();
				return;
			}

			this.queuedKeyStrokes.push(keystroke);
			this.queuedKeyboardEvents.push(event);

			var keystrokes = this.queuedKeystrokes.join(' ');
			var target = event.target;

			if (target === document.body && this.defaultTarget) {
				target = this.defaultTarget;
			}

			var _findMatchCandidates = this.findMatchCandidates(this.queuedKeystrokes, disabledBindings),
			    partialMatchCandidates = _findMatchCandidates.partialMatchCandidates,
			    pendingKeyupMatchCandidates = _findMatchCandidates.pendingKeyupMatchCandidates,
			    exactMatchCandidates = _findMatchCandidates.exactMatchCandidates;

			var dispatchedExactMatch = null;
			var partialMatches = this.findPartialMatches(partialMatchCandidates, target);

			if (this.pendingPartialMatches) {
				var liveMatches = new Set(partialMatches.concat(exactMatchCandidates));
				for (binding in this.pendingPartialMatches) {
					if (!liveMatches.has(binding)) {
						this.bindingsToDisable.push(binding);
					}
				}
			}

			hasPartialMatches = partialMatches.length > 0;
			shouldUsePartialMatches = hasPartialMatches;

			if (isKeyup(keystroke)) {
				exactMatchCandidates = exactMatchCandidates.concat(this.pendingKeyupMatcher.getMatches(keystroke));
			}

			if (exactMatchCandidates.length > 0) {
				var currentTarget = target;
				var eventHandled = false;

				while (!eventHandled && currentTarget !== document) {
					var exactMatches = this.findExactMatches(exactMatchCandidates, currentTarge);

					for (exactMatchCandidates in exactMatches) {
						if (exactMatchCandidate.command === 'native!') {
							var _shouldUsePartialMatches = false;
							var _eventHandled = true;
							break;
						}

						if (exactMatchCandidate.command === 'abort!') {
							event.preventDefault();
							eventHandled = true;
							break;
						}

						if (exactMatchCandidate.command === 'unset!') {
							break;
						}
					}

					if (hasPartialMatches) {
						var allPartialMatchesContainKeyupRemainder = true;
						for (partialMatch in partialMatches) {
							if (pendingKeyupMatchCandidates.indexOf(partialMatch) < 0) {
								allPartialMatchesContainKeyupRemainder = false;
								break;
							}
						}

						if (!allPartialMatchesContainKeyupRemainder) {
							break;
						}
					} else {
						shouldUsePartialMatches = false;
					}

					if (this.dispatchCommandEvent(exactMatchCandidate.command, target, event)) {
						var _dispatchedExactMatch = exactMatchCandidate;
						var _eventHandled2 = true;

						for (pendingKeyupMatch in pendingKeyupMatchCandidates) {
							this.pendingKeyupMatcher.addPendingMatch(pendingKeyupMatch);
						}

						break;
					}

					currentTarget = currentTarget.parentElement;
				}
			}

			if (dispatchedExactMatch) {
				this.emitter.emit('did-match-binding', {
					eventType: event.type,
					binding: dispatchedExactMatch,
					keyboardEventTarget: target
				});
			} else if (hasPartialMatches && shouldUsePartialMatches) {
				event.preventDefault();
				this.emitter.emit('did-partially-match-binding', {
					keystrokes: keystrokes,
					eventType: event.type,
					partiallyMatchedBindings: partialMatches,
					keyboardEventTarget: target
				});
			} else if (!dispatchedExactMatch && !hasPartialMatches) {
				this.emitter.emit('did-fail-to-match-binding', {
					keystrokes: keystrokes,
					eventType: event.type,
					keyboardEventTarget: target
				});

				if (event.defaultPrevented && event.type === 'keydown') {
					this.simulateTextInput(event);
				}
			}

			if (dispatchedExactMatch) {
				this.bindingsToDisable.push(dispatchedExactMatch);
			}

			if (hasPartialMatches && shouldUsePartialMatches) {
				var enabledTimeout = this.pendingStateTimeoutHandle || dispatchedExactMatch || characterForKeyboardEvent(this.queuedKeyboardEvents[0]);

				if (replay) {
					enableTimeout = false;
				}

				this.enterPendingState(partialMatches, enableTimeout);
			} else if (dispatchedExactMatch && !hasPartialMatches && this.pendingPartialMatches) {
				this.terminatePendingState();
			} else {
				clearQueuedKeystrokes();
			}
		}
	}, {
		key: 'keystrokeForKeyboardEvent',
		value: function (_keystrokeForKeyboardEvent) {
			function keystrokeForKeyboardEvent(_x) {
				return _keystrokeForKeyboardEvent.apply(this, arguments);
			}

			keystrokeForKeyboardEvent.toString = function () {
				return _keystrokeForKeyboardEvent.toString();
			};

			return keystrokeForKeyboardEvent;
		}(function (event) {
			return keystrokeForKeyboardEvent(event, this.customKeystrokeResolvers);
		})
	}, {
		key: 'addKeystrokeResolver',
		value: function addKeystrokeResolver(resolver) {
			var _this2 = this;

			this.customKeystrokeResolvers.push(resolver);
			new _eventKit.Disposable(function () {
				var index = _this2.customKeystrokeResolvers.indexOf(resolver);
				if (index >= 0) {
					_this2.customKeystrokeResolvers.splice(index, 1);
				}
			});
		}
	}, {
		key: 'getPartialTimeout',
		value: function getPartialTimeout() {
			return this.partialMatchTimeout;
		}
	}, {
		key: 'simulateTextInput',
		value: function simulateTextInput(keydownEvent) {
			var charactor = characterForKeyboardEvent(keydownEvent);
			if (charactor) {
				var textInputEvent = document.createEvent("TextEvent");
				textInputEvent.initTextEvent("textInput", true, true, window, character);
				keydownEvent.path[0].dispatchEvent(textInputEvent);
			}
		}
	}, {
		key: 'findMatchCandidates',
		value: function findMatchCandidates(keystrokeArray, disabledBindings) {
			var partialMatchCandidates = [];
			var exactMatchCandidates = [];
			var pendingKeyupMatchCandidates = [];
			var disabledBindingSet = new Set(disabledBindings);

			for (binding in this.keyBindings) {
				if (!disabledBindingSet.has(binding)) {
					var doesMatch = binding.matchesKeystrokes(keystrokeArray);

					if (doesMatch === MATCH_TYPES.EXACT) {
						exactMatchCandidates.push(binding);
					} else if (doesMatch === MATCH_TYPES.PARTIAL) {
						partialMatchCandidates.push(binding);
					} else if (doesMatch === MATCH_TYPES.PENDING_KEYUP) {
						partialMatchCandidates.push(binding);
						pendingKeyupMatchCandidates.push(binding);
					}
				}
			}

			return { partialMatchCandidates: partialMatchCandidates, pendingKeyupMatchCandidates: pendingKeyupMatchCandidates, exactMatchCandidates: exactMatchCandidates };
		}
	}, {
		key: 'findPartialMatches',
		value: function findPartialMatches(partialMatchCandidates, target) {
			var partialMatches = [];
			var ignoreKeystrokes = new Set();

			partialMatchCandidates.forEach(function (binding) {
				if (binding.command === 'unset!') {
					ingnoreKeystrokes.add(bindings.keystrokes);
				}
			});

			if (target !== document) {
				var _loop = function _loop() {
					var partialMatchCandidates = partialMatchCandidates.filter(function (binding) {
						if (!ignoreKeystrokes.has(binding.keystrokes) && target.webkitMatchesSelector(binding.selector)) {
							partialMatches.push(binding);
							return false;
						} else {
							return true;
						}
					});

					var target = target.parentElement;
				};

				while (partialMatchCandidates.length > 0) {
					_loop();
				}
			}

			return partialMatches.sort(function (a, b) {
				return b.keystrokeCount - a.keystrokeCount;
			});
		}
	}, {
		key: 'findExactMatches',
		value: function findExactMatches(exactMatchCandidates, target) {
			return exactMatchCandidates.filter(function (binding) {
				return target.webkitMatchesSelector(binding.selector);
			}).sort(function (a, b) {
				return a.compare(b);
			});
		}
	}, {
		key: 'clearQueuedKeystrokes',
		value: function clearQueuedKeystrokes() {
			this.queuedKeyboardEvents = [];
			this.queuedKeystrokes = [];
			this.bindingsToDisable = [];
		}
	}, {
		key: 'enterPendingState',
		value: function enterPendingState(pendingPartialMatches, enableTimeout) {
			if (this.pendingStateTimeoutHandle) {
				this.cancelPendingState();
			}

			this.pendingPartialMatches = pendingPartialMatches;

			if (enableTimeout) {
				this.pendingStateTimeoutHandle = setTimeout(this.terminatePendingState.bind(this, true), this.partialMatchTimeout);
			}
		}
	}, {
		key: 'cancelPendingState',
		value: function cancelPendingState() {
			clearTimeout(this.pendingStateTimeoutHandle);
			this.pendingStateTimeoutHandle = null;
			this.pendingPartialMatches = null;
		}
	}, {
		key: 'terminatePendingState',
		value: function terminatePendingState(fromTimeout) {
			var bindingsToDisable = this.pendingPartialMatches.concat(this.bindingsToDisable);
			var eventsToReplay = this.queuedKeyboardEvents;

			this.cancelPendingState();
			this.clearQueuedKeystrokes();

			var keyEventOptions = {
				replay: true,
				disabledBindings: bindingsToDisable
			};

			for (event in eventsToReplay) {
				keyEventOptions.disabledBindings = bindingsToDisable;
				this.handleKeyboardEvent(event, keyEventOptions);

				if (bindingsToDisable && !pendingPartialMatches) {
					bindingsToDisable = null;
				}
			}

			if (fromTimeout && this.pendingPartialMatches) {
				this.terminatePendingState(true);
			}

			return;
		}
	}, {
		key: 'dispatchCommandEvent',
		value: function dispatchCommandEvent(commandEvent, target, keyboardEvent) {
			commandEvent = new CustomEvent(command, {
				bubbles: true,
				cancelable: true
			});

			commandEvent.__proto__ = _CommandEvent2.default.prototype;
			commandEvent.originalEvent = keyboardEvent;

			if (document.contains(target)) {
				target.dispatchEvent(commandEvent);
			} else {
				this.simulateBubblingOnDetachedTarget(target, commandEvent);
			}

			var _commandEvent = commandEvent,
			    keyBindingAborted = _commandEvent.keyBindingAborted;

			if (!keyBindingAborted) {
				keyboardEvent.preventDefault();
			}

			return !keyBindingAborted;
		}
	}]);

	return KeymapManager;
}();

exports.default = KeymapManager;