import { $$ } from 'space-pencil'
import KeymapManager from '../src/KeyMapManager';
import { appendContent, stub, getFakeClock, mockProcessPlatform, buildKeydownEvent, buildKeyupEvent } from '../__test-helpers__';

let keymapManager = null;

describe('KeymapManager', () => {

	beforeEach(() => {
		keymapManager = new KeymapManager();
	});

	afterEach(() => {
		keymapManager.destroy();
	});

	describe('::handleKeyboardEvent(event)', () => {

		describe('When the keystroke matches no bindings', () => {
			test('does not prevent the event\'s default action', () => {
				const event = buildKeydownEvent({ key: 'q' });
				keymapManager.handleKeyboardEvent(event);
				expect(event.defaultPrevented).toBe(false);
			});
		});

		describe('when the keystroke matches one binding on any particular element	', () => {

			let events, elementA, elementB;

			beforeEach(() => {
				elementA = appendContent($$(function() {
					return this.div({
						class: 'a'
					}, function() {
						return this.div({
							class: 'b c'
						});
					});
				}));
				elementB = elementA.firstChild;

				events = [];
				elementA.addEventListener('x-command', (e) => events.push(e));
				elementA.addEventListener('y-command', (e) => events.push(e));

				keymapManager.add('test', {
					".a": {
						"ctrl-x": "x-command",
						"ctrl-y": "y-command"
					},
					".c": {
						"ctrl-y": "z-command"
					},
					".b": {
						"ctrl-y": "y-command"
					}
				})
			});

			test("dispatches the matching binding's command event on the keyboard event's target", () => {
				keymapManager.handleKeyboardEvent(buildKeydownEvent({
					key: 'y',
					ctrlKey: true,
					target: elementB
				}));

				expect(events.length).toEqual(1);
				expect(events[0].type).toEqual('y-command');
				expect(events[0].target).toEqual(elementB);
			});

		});
	});
});
