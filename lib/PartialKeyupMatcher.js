'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var PartialKeyupMatcher = function () {
	function PartialKeyupMatcher() {
		_classCallCheck(this, PartialKeyupMatcher);

		this._pendingMatches = new Set();
	}

	_createClass(PartialKeyupMatcher, [{
		key: 'addPendingMatch',
		value: function addPendingMatch(keyBinding) {
			this._pendingMatches.add(keyBinding);
			keyBinding['nextKeyUpIndex'] = 0;
		}
	}, {
		key: 'getMatches',
		value: function getMatches(userKeyupKeystroke) {
			userKeyupKeystroke = this._normalizeKeystroke(userKeyupKeystroke);

			var matches = new Set();

			// Loop over each pending keyup match.
			var _iteratorNormalCompletion = true;
			var _didIteratorError = false;
			var _iteratorError = undefined;

			try {
				for (var _iterator = this._pendingMatches[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
					var keyBinding = _step.value;

					var bindingKeystrokeToMatch = this._normalizeKeystroke(keyBinding.getKeyups()[keyBinding['nextKeyUpIndex']]);
					if (userKeyupKeystroke === bindingKeystrokeToMatch) {
						this._updateStateForMatch(matches, keyBinding);
					}
				}
			} catch (err) {
				_didIteratorError = true;
				_iteratorError = err;
			} finally {
				try {
					if (!_iteratorNormalCompletion && _iterator.return) {
						_iterator.return();
					}
				} finally {
					if (_didIteratorError) {
						throw _iteratorError;
					}
				}
			}

			return [].concat(_toConsumableArray(matches));
		}
	}, {
		key: '_normalizeKeystroke',
		value: function _normalizeKeystroke(keystroke) {
			if (keystroke[0] === '^') {
				return keystroke.substring(1);
			}

			return keystroke;
		}
	}, {
		key: '_updateStateForMatch',
		value: function _updateStateForMatch(matches, keyBinding) {
			if (keyBinding['nextKeyUpIndex'] === keyBinding.getKeyups().length - 1) {
				this._pendingMatches.delete(keyBinding);
				matches.add(keyBinding);
			} else {
				keyBinding['nextKeyUpIndex']++;
			}
		}
	}]);

	return PartialKeyupMatcher;
}();

exports.default = PartialKeyupMatcher;