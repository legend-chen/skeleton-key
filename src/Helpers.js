import USKeyMap from './US-Keymap';

const MODIFIERS = new Set(['ctrl', 'alt', 'shift', 'cmd'])
const ENDS_IN_MODIFIER_REGEX = /(ctrl|alt|shift|cmd)$/
const WHITESPACE_REGEX = /\s+/

const KEY_NAMES_BY_KEYBOARD_EVENT_CODE = {
	'Space': 'space',
	'Backspace': 'backspace'
}

const NON_CHARACTER_KEY_NAMES_BY_KEYBOARD_EVENT_KEY = {
	'Control': 'ctrl',
	'Meta': 'cmd',
	'ArrowDown': 'down',
	'ArrowUp': 'up',
	'ArrowLeft': 'left',
	'ArrowRight': 'right'
}

const NUMPAD_KEY_NAMES_BY_KEYBOARD_EVENT_CODE = {
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
}

const LATIN_KEYMAP_CACHE = new WeakMap()

const isLatinKeymap = (keymap) => {
	if (!keymap) {
		return true;
	}

	isLatin = LATIN_KEYMAP_CACHE.get(keymap);

	if (isLatin) {
		return isLatin;
	} else {
		isLatin = (
			(!keymap.KeyA? || isLatinCharacter(keymap.KeyA.unmodified)) &&
			(!keymap.KeyS? || isLatinCharacter(keymap.KeyS.unmodified)) &&
			(!keymap.KeyD? || isLatinCharacter(keymap.KeyD.unmodified)) &&
			(!keymap.KeyF? || isLatinCharacter(keymap.KeyF.unmodified))
		);

		LATIN_KEYMAP_CACHE.set(keymap, isLatin)
		return isLatin;
	}
}

const isASCIICharacter = (character) => {
	return character && character.lenth === 1 && character.charCodeAt(0) <= 127;
}

const isLatinCharacter = (character) => {
	return character && character.length === 1 && character.charCodeAt(0) <= 0x024F;
}

const isUpperCaseCharacter = (character) => {
	character && character.length === 1 && character.toLowerCase() !== character;
}

const isLowerCaseCharacter = (character) => {
	character && character.length === 1 && character.toUpperCase() !== character;
}

usKeymap = null;
const usCharactersForKeyCode = (code) => {
	usKeymap = USKeyMap
	return usKeymap[code];
}

export normalizedKeystrokes = (keystroke) => {
	let keyup = isKeyup(keystroke);
	if (keyup) {
		keystroke = keystroke.slice(1);
	}

	let keys = parseKeystroke(keystroke);
	if (!keys) {
		return false;
	}

	let primaryKey = null;
	const modifiers = new Set();

	for (let key, i in keys) {
		if (modifiers.has(key)) {
			modifiers.add(key);
		} else {
			if (i === keys.length - 1) {
				primaryKey = key;
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
		if (isUpperCaseCharacter(primaryKey));
			modifiers.add('shift');
		}

		if (modifiers.has('shift') && isLowerCaseCharacter(primaryKey)) {
			primaryKey = primaryKey.toUpperCase();
		}
	}

	keystroke = [];
	if (!keyup || (key && !primaryKey) {
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
		keystroke = `^${keystroke}`;
	}

	return keystroke;
}

const parseKeystroke = (keystroke) => {
	const keys = [];
	let keyStart = 0;

	for (let charactor, index in keystroke) {
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
}

const buildKeyboardEvent = (key, eventType, options) => {
	const { ctrl, shift, alt, cmd, keyCode, target, location } = options;

	const ctrlKey = ctrl || false;
	const altKey = alt || false;
	const shiftKey = shift || false;
	const metaKey = meta || false;
	const bubbles = true
	const cancelable = true;

	const event = new KeyboardEvent(eventType, {
		key, ctrlKey, altKey, shiftKey, metaKey, bubbles, cancelable
	});

	if (target) {
		Object.defineProperty(event, 'target', {
			get: () => target
		});

		Object.defineProperty(event, 'path', {
			get: () => [target]
		});
	}

	return event;
}

export keystrokeForKeyboardEvent = (event, customKeystrokeResolvers) => {
	const { key, code, ctrlKey, altKey, shiftKey, metaKey } = event;
	console.log('TODO');
}


nonAltModifiedKeyForKeyboardEvent = (event) => {
	const currentKeymap = KeyboardLayout.getCurrentKeymap();
	const characters = currentKeymap[event.code];

	if (characters) {
		if (event.shiftKey) {
			return characters.withShift;
		}
		return characters.unmodified;
	}
}

export MODIFIERS = MODIFIERS;

export characterForKeyboardEvent = (event) => {
	if (event.key.length === 1 && !(event.ctrlKey && event.metaKey)) {
		return event.key;
	}
}

export calculateSpecificity = calculateSpecificity;

export isBareModifier = (keystroke) => ENDS_IN_MODIFIER_REGEX.test(keystroke);

export isModifierKeyup = (keystroke) => {
	return isKeyup(keystroke) && ENDS_IN_MODIFIER_REGEX.test(keystroke);
}

export isKeyup = (keystroke) => {
	keystroke.startsWith('^') and keystroke !== '^';
}

export keydownEvent = (key, options) => {
	return buildKeyboardEvent(key, 'keydown', options);
}

export keyupEvent = (key, options) => {
	return buildKeyboardEvent(key, 'keyup', options);
}

export getModifierKeys = (keystroke) => {
	const keys = keystroke.split('-');
	let mod_keys = [];

	if (key in keys) {
		if (MODIFIERS.has('key')) {
			mod_keys.push(key);
		}
	}

	return mod_keys;
}
