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

		// describe('When the keystroke matches no bindings', () => {
		// 	test('does not prevent the event\'s default action', () => {
		// 		const event = buildKeydownEvent({ key: 'q' });
		// 		keymapManager.handleKeyboardEvent(event);
		// 		expect(event.defaultPrevented).toBe(false);
		// 	});
		// });

		describe('when the keystroke matches one binding on any particular element', () => {

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

			test("Prevents the default action", () => {
				const event = buildKeydownEvent({
					key: 'y',
					ctrlKey: true,
					target: elementB
				});

				keymapManager.handleKeyboardEvent(event);
				expect(event.defaultPrevented).toBe(true);
			});

			describe("if .abortKeyBinding() is called on the command event", () => {
				test("proceeds directly to the next matching binding and does not prevent the keyboard event's default action", () => {

					const aborted = (e) => {
						events.push(e);
						return e.abortKeyBinding();
					}

					elementB.addEventListener('y-command', aborted);
					elementB.addEventListener('y-command', (e) => events.push(e));
					elementB.addEventListener('z-command', aborted);

					const event = buildKeydownEvent({
						key: 'y',
						ctrlKey: true,
						target: elementB
					});

					keymapManager.handleKeyboardEvent(event);

					expect(event.defaultPrevented).toBe(false);
					expect(events.length).toBe(3);
					expect(events[0].type).toEqual('z-command');
					expect(events[0].target).toEqual(elementB);
					expect(events[1].type).toEqual('y-command');
					expect(events[1].target).toEqual(elementB);
					expect(events[2].type).toEqual('y-command');
					expect(events[2].target).toEqual(elementB);
				});
			});

			describe("if the keyboard event's target is document.body", () => {
				test("starts matching keybindings at the .defaultTarget", () => {
					keymapManager.defaultTarget = elementA;
					keymapManager.handleKeyboardEvent(buildKeydownEvent({
						key: 'y',
						ctrlKey: true,
						target: document.body
					}));

					expect(events.length).toBe(1);
					expect(events[0].type).toEqual('y-command');
					expect(events[0].target).toEqual(elementA);
				})
			});

			describe("if the matching binding's command is 'native!'", () => {
				it ("terminates without preventing the browser's default action", () => {

					elementA.addEventListener('native!', (e) => events.push(e));

					keymapManager.add("test", {
						".b": {
							"ctrl-y": "native!"
						}
					});

					const event = buildKeydownEvent({
						key: 'y',
						ctrlKey: true,
						target: elementB
					});

					keymapManager.handleKeyboardEvent(event);

					// expect(events).toEqual([]);
					expect(event.defaultPrevented).toBe(false);
				});
			});
		});
	});
});
