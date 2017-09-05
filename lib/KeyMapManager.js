'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

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

		// Do I really need to do this?
		this.clear();
	}

	_createClass(KeymapManager, [{
		key: 'clear',
		value: function clear() {}
	}]);

	return KeymapManager;
}();

exports.default = KeymapManager;