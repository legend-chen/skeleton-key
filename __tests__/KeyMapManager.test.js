import KeymapManager from '../src/KeyMapManager';
import { keydownEvent } from '../src/Helpers';

let keymapManager = null;

beforeEach(() => {
	keymapManager = new KeymapManager();
});

afterEach(() => {
	keymapManager.destroy();
});



describe('::handleKeyboardEvent(event)', () => {

	describe('When the keystroke matches no bindings', () => {
		test('does not prevent the event\'s default action', () => {
			const event = keydownEvent({ key: 'q' });
			keymapManager.handleKeyboardEvent(event);
			expect(event.defaultPrevented).toBe(false);
		});
	});
});
