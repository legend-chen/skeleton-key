'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _eventKit = require('event-kit');

var _CommandEvent = require('./CommandEvent');

var _CommandEvent2 = _interopRequireDefault(_CommandEvent);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
	}]);

	return KeymapManager;
}();

exports.default = KeymapManager;