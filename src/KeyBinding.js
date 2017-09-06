import _ from 'lodash';

import {
	calculateSpecificity,
	MODIFIERS,
	isKeyup
} from './helpers'

const MATCH_TYPES = {
	EXACT: 'exact',
	PARTIAL: 'partial',
	PENDING_KEYUP: 'pendingKeyup',
}

export { MATCH_TYPES };

class KeyBinding {
	static currentIndex = 1;
	enabled = true;

	constructor(source, command, keystrokes, selector, priority) {
		this.source = source;
		this.command = command;
		this.keystrokes = keystrokes;
		this.priority = priority;
		this.keystrokeArray = this.keystrokes.split(' ');
		this.keystrokeCount = this.keystrokeArray.length;
		this.selector = selector.replace(/!important/g, '');
		this.specificity = calculateSpecificity(selector);
		this.index = this.constructor.currentIndex++;
		this.cachedKeyups = null;
	}

	matches(keystroke) {
		const multiKeystroke = /\s/.test(keystroke);

		if (multiKeystroke) {
			keystroke === this.keystroke;
		} else {
			keystroke.split(' ')[0] === this.keystroke.split(' ')[0];
		}
	}

	compare(keyBinding) {
		if (keyBinding.priority === this.priority) {
			if (keyBinding.specificity === this.specificity) {
				keyBinding.index - this.index;
			} else {
				keyBinding.specificity - this.specificity;
			}
		} else {
			keyBinding.priority - this.priority
		}
	}

	getKeyups() {
		if (this.cachedKeyups) {
			return this.cachedKeyups;
		}

		for (var i = 0, l = this.keystrokeArray.length; i < l; i++) {
			const keystroke = this.keystrokeArray[i];

			if (isKeyup(keystroke)) {
				return this.cachedKeyups = this.keystrokeArray.slice(i)
			}
		}
	}

	matchesKeystrokes(userKeystrokes) {
		let userKeystrokeIndex = -1;
		let userKeystrokesHasKeydownEvent = false;

		const matchesNextUserKeystroke = (bindingKeystroke) => {
			while (userKeystrokeIndex < userKeystrokes.length - 1) {
				userKeystrokeIndex += 1;

				const userKeystroke = userKeystrokes[userKeystrokeIndex];
				const isKeydownEvent = !isKeyup(userKeystroke);

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
		}

		let isPartialMatch = false;
		let bindingRemainderContainsOnlyKeyups = true;
		let bindingKeystrokeIndex = 0;
		let doesMatch;

		for (var i = 0, l = this.keystrokeArray.length; i < l; i ++) {
			const bindingKeystroke = this.keystrokeArray[i];

			if (!isPartialMatch) {
				doesMatch = matchesNextUserKeystroke(bindingKeystroke);

				if (doesMatch === false) {
					return false;
				} else if (!doesMatch) {
					if (userKeystrokesHasKeydownEvent) {
						isPartialMatch = true;
					} else {
						return false;
					}
				}
			} else {
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
}

export default KeyBinding;
