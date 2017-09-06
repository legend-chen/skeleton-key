import { calculateSpecificity } from 'clear-cut';
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

	let isLatin = LATIN_KEYMAP_CACHE.get(keymap);

	if (isLatin) {
		return isLatin;
	} else {
		isLatin = (
			(!keymap.KeyA || isLatinCharacter(keymap.KeyA.unmodified)) &&
			(!keymap.KeyS || isLatinCharacter(keymap.KeyS.unmodified)) &&
			(!keymap.KeyD || isLatinCharacter(keymap.KeyD.unmodified)) &&
			(!keymap.KeyF || isLatinCharacter(keymap.KeyF.unmodified))
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

let usKeymap = null;
const usCharactersForKeyCode = (code) => {
	usKeymap = USKeyMap
	return usKeymap[code];
}

const normalizeKeystrokes = (keystrokes) => {

	const normalizedKeystrokes = []
	let _keystrokes = keystrokes.split(WHITESPACE_REGEX);

	for (let i = 0, l = _keystrokes.length; i < l; i++) {

		const keystroke = _keystrokes[i];
		const normalizedKeystroke = normalizeKeystroke(keystroke);

		if (normalizedKeystroke) {
			normalizedKeystrokes.push(normalizedKeystroke)
		} else {
			return false
		}
	}

	return normalizedKeystrokes.join(' ');
}

const normalizeKeystroke = (keystroke) => {
	var i, j, key, keys, keyup, len, modifiers, primaryKey;
  if (keyup = isKeyup(keystroke)) {
    keystroke = keystroke.slice(1);
  }
  keys = parseKeystroke(keystroke);
  if (!keys) {
    return false;
  }
  primaryKey = null;
  modifiers = new Set;
  for (i = j = 0, len = keys.length; j < len; i = ++j) {
    key = keys[i];
    if (MODIFIERS.has(key)) {
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
    if (primaryKey != null) {
      primaryKey = primaryKey.toLowerCase();
    }
  } else {
    if (isUpperCaseCharacter(primaryKey)) {
      modifiers.add('shift');
    }
    if (modifiers.has('shift') && isLowerCaseCharacter(primaryKey)) {
      primaryKey = primaryKey.toUpperCase();
    }
  }
  keystroke = [];
  if (!keyup || (keyup && (primaryKey == null))) {
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
  if (primaryKey != null) {
    keystroke.push(primaryKey);
  }
  keystroke = keystroke.join('-');
  if (keyup) {
    keystroke = "^" + keystroke;
  }
  return keystroke;
}

const parseKeystroke = (keystroke) => {
	// TODO: Tidy this up.
	var character, i, index, keyStart, keys, len;
	keys = [];
	keyStart = 0;
	for (index = i = 0, len = keystroke.length; i < len; index = ++i) {
		character = keystroke[index];
		if (character === '-') {
			if (index > keyStart) {
				keys.push(keystroke.substring(keyStart, index));
				keyStart = index + 1;
				if (keyStart === keystroke.length) {
					return false;
				}
			}
		}
	}
	if (keyStart < keystroke.length) {
		keys.push(keystroke.substring(keyStart));
	}

	return keys;
}

const buildKeyboardEvent = (key, eventType, options = {}) => {
	const { ctrl, shift, alt, cmd, keyCode, target, location } = options;

	const ctrlKey = ctrl || false;
	const altKey = alt || false;
	const shiftKey = shift || false;
	const metaKey = cmd || false;
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

const keystrokeForKeyboardEvent = (event, customKeystrokeResolvers) => {
	let { key, code, ctrlKey, altKey, shiftKey, metaKey } = event;

	if (NUMPAD_KEY_NAMES_BY_KEYBOARD_EVENT_CODE[code] && event.getModifierState('NumLock')) {
		key = NUMPAD_KEY_NAMES_BY_KEYBOARD_EVENT_CODE[code];
	}

	if (KEY_NAMES_BY_KEYBOARD_EVENT_CODE[code]){
		key = KEY_NAMES_BY_KEYBOARD_EVENT_CODE[code];
	}

	let isNonCharacterKey = key.length > 1;
	if (isNonCharacterKey) {
		key = NON_CHARACTER_KEY_NAMES_BY_KEYBOARD_EVENT_KEY[key] || key.toLowerCase();
	} else {
		if (shiftKey) {
			key = key.toUpperCase();
		} else {
			key = key.toLowerCase();
		}
	}

	// if (
	// 	(key.length === 1 && !isLatinKeymap(KeyboardLayout.getCurrentKeymap())) ||
	// 	(metaKey && KeyboardLayout.getCurrentKeyboardLayout() === 'com.apple.keylayout.DVORAK-QWERTYCMD')
	// ) {
	// 	if (characters = usCharactersForKeyCode(event.code)) {
	// 		if (event.shiftKey) {
	// 			key = characters.withShift;
	// 		}
	//
	// 		key = characters.unmodified;
	// 	}
	// }

	let keystroke = '';
	let keystrokes = [];

	if (key === 'ctrl' || (ctrlKey && event.type !== 'keyup')) {
		keystrokes.push('ctrl');
	}

	if (key === 'alt' || (altKey && event.type !== 'keyup')) {
		keystrokes.push('alt');
	}

	if (key === 'shift' || (shiftKey && event.type !== 'keyup'
		&& (isNonCharacterKey || (isLatinCharacter(key) && isUpperCaseCharacter(key))))
	) {
		keystrokes.push('shift');
	}

	if (key === 'cmd' || (metaKey && event.type !== 'keyup')) {
		keystrokes.push('cmd');
	}

	if (!MODIFIERS.has(key)) {
		keystrokes.push(key);
	}

	keystroke = keystrokes.join('-');

	if (event.type === 'keyup') {
		keystroke = normalizeKeystroke(`^${keystroke}`);
	}

	// TODO: Add custom resolvers

	return keystroke;
}

const nonAltModifiedKeyForKeyboardEvent = (event) => {
	// const currentKeymap = KeyboardLayout.getCurrentKeymap();
	// const characters = currentKeymap[event.code];
	//
	// if (characters) {
	// 	if (event.shiftKey) {
	// 		return characters.withShift;
	// 	}
	// 	return characters.unmodified;
	// }
}

const characterForKeyboardEvent = (event) => {
	if (event.key.length === 1 && !(event.ctrlKey && event.metaKey)) {
		return event.key;
	}
}

const isBareModifier = (keystroke) => ENDS_IN_MODIFIER_REGEX.test(keystroke);

const isModifierKeyup = (keystroke) => {
	return isKeyup(keystroke) && ENDS_IN_MODIFIER_REGEX.test(keystroke);
}

const isKeyup = (keystroke) => {
	keystroke.startsWith('^') && keystroke !== '^';
}

const keydownEvent = (key, options) => {
	return buildKeyboardEvent(key, 'keydown', options);
}

const keyupEvent = (key, options) => {
	return buildKeyboardEvent(key, 'keyup', options);
}

const getModifierKeys = (keystroke) => {
	const keys = keystroke.split('-');
	let mod_keys = [];

	if (key in keys) {
		if (MODIFIERS.has('key')) {
			mod_keys.push(key);
		}
	}

	return mod_keys;
}

export {
	normalizeKeystrokes,
	keystrokeForKeyboardEvent,
	MODIFIERS,
	characterForKeyboardEvent,
	calculateSpecificity,
	isBareModifier,
	isModifierKeyup,
	isKeyup,
	keydownEvent,
	keyupEvent,
	getModifierKeys,
	buildKeyboardEvent,
};
