'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.getModifierKeys = exports.keyupEvent = exports.keydownEvent = exports.isKeyup = exports.isModifierKeyup = exports.isBareModifier = exports.calculateSpecificity = exports.characterForKeyboardEvent = exports.MODIFIERS = exports.keystrokeForKeyboardEvent = exports.normalizedKeystrokes = undefined;

var _clearCut = require('clear-cut');

var _USKeymap = require('./US-Keymap');

var _USKeymap2 = _interopRequireDefault(_USKeymap);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var MODIFIERS = new Set(['ctrl', 'alt', 'shift', 'cmd']);
var ENDS_IN_MODIFIER_REGEX = /(ctrl|alt|shift|cmd)$/;
var WHITESPACE_REGEX = /\s+/;

var KEY_NAMES_BY_KEYBOARD_EVENT_CODE = {
	'Space': 'space',
	'Backspace': 'backspace'
};

var NON_CHARACTER_KEY_NAMES_BY_KEYBOARD_EVENT_KEY = {
	'Control': 'ctrl',
	'Meta': 'cmd',
	'ArrowDown': 'down',
	'ArrowUp': 'up',
	'ArrowLeft': 'left',
	'ArrowRight': 'right'
};

var NUMPAD_KEY_NAMES_BY_KEYBOARD_EVENT_CODE = {
	'Numpad0': 'numpad0',
	'Numpad1': 'numpad1',
	'Numpad2': 'numpad2',
	'Numpad3': 'numpad3',
	'Numpad4': 'numpad4',
	'Numpad5': 'numpad5',
	'Numpad6': 'numpad6',
	'Numpad7': 'numpad7',
	'Numpad8': 'numpad8',
	'Numpad9': 'numpad9'
};

var LATIN_KEYMAP_CACHE = new WeakMap();

var isLatinKeymap = function isLatinKeymap(keymap) {
	if (!keymap) {
		return true;
	}

	isLatin = LATIN_KEYMAP_CACHE.get(keymap);

	if (isLatin) {
		return isLatin;
	} else {
		isLatin = (!keymap.KeyA || isLatinCharacter(keymap.KeyA.unmodified)) && (!keymap.KeyS || isLatinCharacter(keymap.KeyS.unmodified)) && (!keymap.KeyD || isLatinCharacter(keymap.KeyD.unmodified)) && (!keymap.KeyF || isLatinCharacter(keymap.KeyF.unmodified));

		LATIN_KEYMAP_CACHE.set(keymap, isLatin);
		return isLatin;
	}
};

var isASCIICharacter = function isASCIICharacter(character) {
	return character && character.lenth === 1 && character.charCodeAt(0) <= 127;
};

var isLatinCharacter = function isLatinCharacter(character) {
	return character && character.length === 1 && character.charCodeAt(0) <= 0x024F;
};

var isUpperCaseCharacter = function isUpperCaseCharacter(character) {
	character && character.length === 1 && character.toLowerCase() !== character;
};

var isLowerCaseCharacter = function isLowerCaseCharacter(character) {
	character && character.length === 1 && character.toUpperCase() !== character;
};

var usKeymap = null;
var usCharactersForKeyCode = function usCharactersForKeyCode(code) {
	usKeymap = _USKeymap2.default;
	return usKeymap[code];
};

var normalizedKeystrokes = function normalizedKeystrokes(keystroke) {
	var keyup = isKeyup(keystroke);
	if (keyup) {
		keystroke = keystroke.slice(1);
	}

	var keys = parseKeystroke(keystroke);
	if (!keys) {
		return false;
	}

	var primaryKey = null;
	var modifiers = new Set();

	for (var i = 0, len = keys.length; i < len; i++) {
		var _key = keys[i];

		if (modifiers.has(_key)) {
			modifiers.add(_key);
		} else {
			if (i === keys.length - 1) {
				primaryKey = _key;
			} else {
				return false;
			}
		}
	}

	if (keyup) {
		if (primaryKey) {
			primaryKey = primaryKey.toLowerCase();
		}
	} else {

		if (isUpperCaseCharacter(primaryKey)) {
			;
			modifiers.add('shift');
		}

		if (modifiers.has('shift') && isLowerCaseCharacter(primaryKey)) {
			primaryKey = primaryKey.toUpperCase();
		}
	}

	keystroke = [];
	if (!keyup || key && !primaryKey) {
		if (modifiers.has('ctrl')) {
			keystroke.push('ctrl');
		}

		if (modifiers.has('alt')) {
			keystroke.push('alt');
		}

		if (modifiers.has('shift')) {
			keystroke.push('shift');
		}

		if (modifiers.has('cmd')) {
			keystroke.push('cmd');
		}
	}

	if (primaryKey) {
		keystroke.push(primaryKey);
	}
	keystroke.join('-');

	if (keyup) {
		keystroke = '^' + keystroke;
	}

	return keystroke;
};

var parseKeystroke = function parseKeystroke(keystroke) {
	var keys = [];
	var keyStart = 0;

	for (var i = 0, l = keystroke.length; i < l; i++) {
		var charactor = keystroke[i];

		if (charactor === '-') {
			keys.push(keystroke.substring(keyStart, index));
			keyStart = index + 1;

			if (keyStart === keystroke.length) {
				return false;
			}
		}
	}

	if (keyStart < keystroke) {
		keys.push(keystroke.substring(keyStart));
	}

	return keys;
};

var buildKeyboardEvent = function buildKeyboardEvent(key, eventType, options) {
	var ctrl = options.ctrl,
	    shift = options.shift,
	    alt = options.alt,
	    cmd = options.cmd,
	    keyCode = options.keyCode,
	    target = options.target,
	    location = options.location;


	var ctrlKey = ctrl || false;
	var altKey = alt || false;
	var shiftKey = shift || false;
	var metaKey = meta || false;
	var bubbles = true;
	var cancelable = true;

	var event = new KeyboardEvent(eventType, {
		key: key, ctrlKey: ctrlKey, altKey: altKey, shiftKey: shiftKey, metaKey: metaKey, bubbles: bubbles, cancelable: cancelable
	});

	if (target) {
		Object.defineProperty(event, 'target', {
			get: function get() {
				return target;
			}
		});

		Object.defineProperty(event, 'path', {
			get: function get() {
				return [target];
			}
		});
	}

	return event;
};

var keystrokeForKeyboardEvent = function keystrokeForKeyboardEvent(event, customKeystrokeResolvers) {
	var key = event.key,
	    code = event.code,
	    ctrlKey = event.ctrlKey,
	    altKey = event.altKey,
	    shiftKey = event.shiftKey,
	    metaKey = event.metaKey;

	console.log('TODO');
};

var nonAltModifiedKeyForKeyboardEvent = function nonAltModifiedKeyForKeyboardEvent(event) {
	var currentKeymap = KeyboardLayout.getCurrentKeymap();
	var characters = currentKeymap[event.code];

	if (characters) {
		if (event.shiftKey) {
			return characters.withShift;
		}
		return characters.unmodified;
	}
};

var characterForKeyboardEvent = function characterForKeyboardEvent(event) {
	if (event.key.length === 1 && !(event.ctrlKey && event.metaKey)) {
		return event.key;
	}
};

var isBareModifier = function isBareModifier(keystroke) {
	return ENDS_IN_MODIFIER_REGEX.test(keystroke);
};

var isModifierKeyup = function isModifierKeyup(keystroke) {
	return isKeyup(keystroke) && ENDS_IN_MODIFIER_REGEX.test(keystroke);
};

var isKeyup = function isKeyup(keystroke) {
	keystroke.startsWith('^') && keystroke !== '^';
};

var keydownEvent = function keydownEvent(key, options) {
	return buildKeyboardEvent(key, 'keydown', options);
};

var keyupEvent = function keyupEvent(key, options) {
	return buildKeyboardEvent(key, 'keyup', options);
};

var getModifierKeys = function getModifierKeys(keystroke) {
	var keys = keystroke.split('-');
	var mod_keys = [];

	if (key in keys) {
		if (MODIFIERS.has('key')) {
			mod_keys.push(key);
		}
	}

	return mod_keys;
};

exports.normalizedKeystrokes = normalizedKeystrokes;
exports.keystrokeForKeyboardEvent = keystrokeForKeyboardEvent;
exports.MODIFIERS = MODIFIERS;
exports.characterForKeyboardEvent = characterForKeyboardEvent;
exports.calculateSpecificity = _clearCut.calculateSpecificity;
exports.isBareModifier = isBareModifier;
exports.isModifierKeyup = isModifierKeyup;
exports.isKeyup = isKeyup;
exports.keydownEvent = keydownEvent;
exports.keyupEvent = keyupEvent;
exports.getModifierKeys = getModifierKeys;