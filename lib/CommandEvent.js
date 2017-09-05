"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var CommandEvent = function (_CustomEvent) {
	_inherits(CommandEvent, _CustomEvent);

	function CommandEvent() {
		var _ref;

		var _temp, _this, _ret;

		_classCallCheck(this, CommandEvent);

		for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
			args[_key] = arguments[_key];
		}

		return _ret = (_temp = (_this = _possibleConstructorReturn(this, (_ref = CommandEvent.__proto__ || Object.getPrototypeOf(CommandEvent)).call.apply(_ref, [this].concat(args))), _this), _this.keyBindingAborted = false, _this.propagationStopped = false, _temp), _possibleConstructorReturn(_this, _ret);
	}

	_createClass(CommandEvent, [{
		key: "abortKeyBinding",
		value: function abortKeyBinding() {
			this.stopImmediatePropagation();
			this.keyBindingAborted = true;
		}
	}, {
		key: "stopPropagation",
		value: function stopPropagation() {
			this.propagationStopped = true;
			_get(CommandEvent.prototype.__proto__ || Object.getPrototypeOf(CommandEvent.prototype), "stopPropagation", this).call(this);
		}
	}, {
		key: "stopImmediatePropagation",
		value: function stopImmediatePropagation() {
			this.propagationStopped = true;
			_get(CommandEvent.prototype.__proto__ || Object.getPrototypeOf(CommandEvent.prototype), "stopImmediatePropagation", this).call(this);
		}
	}]);

	return CommandEvent;
}(CustomEvent);

exports.default = CommandEvent;