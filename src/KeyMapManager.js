import CommandEvent from './CommandEvent';

class KeymapManager {

	partialMatchTimeout = 1000
	defaultTarget = null
	pendingPartialMatches = null
	pendingStateTimeoutHandle = null

	static buildKeyDownEvent(key, options) {
		keydownEvent(key, options);
	}

	static buildKeyUpEvent(key, options) {
		keydownEvent(key, options);
	}

	constructor(options = {}) {
		this.watchSubscriptions = {};
		this.customKeystrokeResolvers = [];

		// Do I really need to do this?
		this.clear();
	}

	clear() {

	}
}

export default KeymapManager;
