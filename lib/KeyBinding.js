'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var MATCH_TYPES = {
	EXACT: 'exact',
	PARTIAL: 'partial',
	PENDING_KEYUP: 'pendingKeyup'
};

exports.MATCH_TYPES = MATCH_TYPES;

var KeyBinding = function () {
	function KeyBinding(source, command, keystrokes, selector, priority) {
		_classCallCheck(this, KeyBinding);

		this.enabled = true;

		this.source = source;
		this.command = command;
		this.keystrokes = keystrokes;
		this.priority = priority;

		this.keystrokesArray = this.keystrokes.split(' ');
		this.keystrokesCount = this.keystrokeArray.length;
		this.selector = selector.replace(/!important/g, '');
		this.specificity = calculateSpecificity(selector);
		this.index = this.constructor.currentIndex++;
		this.cachedKeyups = null;
	}

	_createClass(KeyBinding, [{
		key: 'matches',
		value: function matches(keystroke) {
			var multiKeystroke = /\s/.test(keystroke);

			if (multiKeystroke) {
				keystroke === this.keystroke;
			} else {
				keystroke.split(' ')[0] === this.keystroke.split(' ')[0];
			}
		}
	}, {
		key: 'compare',
		value: function compare(keyBinding) {
			if (keyBinding.priority === this.priority) {
				if (keyBinding.specificity === this.specificity) {
					keyBinding.index - this.index;
				} else {
					keyBinding.specificity - this.specificity;
				}
			} else {
				keyBinding.priority - this.priority;
			}
		}
	}, {
		key: 'getKeyups',
		value: function getKeyups() {
			if (this.cachedKeyups) {
				return this.cachedKeyups;
			}

			for (var i = 0, l = this.keystrokesArray.length; i < l; i++) {
				var keystroke = this.keystrokesArray[i];

				if (isKeyup(keystroke)) {
					return this.cachedKeyups = this.keystrokeArray.slice(i);
				}
			}
		}
	}, {
		key: 'matchesKeystrokes',
		value: function matchesKeystrokes(userKeystrokes) {
			var userKeystrokeIndex = -1;
			var userKeystrokesHasKeydownEvent = false;

			matchesNextUserKeystroke = function matchesNextUserKeystroke(bindingKeystroke) {
				while (userKeystrokeIndex < userKeystrokes.length - 1) {
					userKeystrokeIndex += 1;
					userKeystroke = userKeystrokes[userKeystrokeIndex];
					var isKeydownEvent = !isKeyup(userKeystroke);

					if (isKeydownEvent) {
						userKeystrokesHasKeydownEvent = true;
					}

					if (bindingKeystroke === userKeystroke) {
						return true;
					} else if (isKeydownEvent) {
						return false;
					}
				}
				return null;
			};

			var isPartialMatch = false;
			var bindingRemainderContainsOnlyKeyups = true;
			var bindingKeystrokeIndex = 0;

			for (bindingKeystroke in this.keystrokeArray) {
				if (!isPartialMatch) {
					doesMatch = matchesNextUserKeystroke(bindingKeystroke);
					if (doesMatch === false) {
						return false;
					}
				} else if (!doesMatch) {
					if (userKeystrokesHasKeydownEvent) {
						isPartialMatch = true;
					} else {
						return false;
					}
				}

				if (isPartialMatch) {
					if (!bindingKeystroke.startsWith('^')) {
						bindingRemainderContainsOnlyKeyups = false;
					}
				}
			}

			if (userKeystrokeIndex < userKeystrokes.length - 1) {
				return false;
			}

			if (isPartialMatch && bindingRemainderContainsOnlyKeyups) {
				return MATCH_TYPES.PENDING_KEYUP;
			} else if (isPartialMatch) {
				return MATCH_TYPES.PARTIAL;
			} else {
				return MATCH_TYPES.EXACT;
			}
		}
	}]);

	return KeyBinding;
}();

KeyBinding.currentIndex = 1;
exports.default = KeyBinding;