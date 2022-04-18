import {Emitter, Disposable, CompositeDesposable} from 'event-kit';
import {isSelectorValid} from 'clear-cut';
import CommandEvent from './CommandEvent';
import KeyBinding, {MATCH_TYPES} from './KeyBinding';
import {
    normalizeKeystrokes,
    keystrokeForKeyboardEvent,
    isBareModifier,
    keydownEvent,
    keyupEvent,
    characterForKeyboardEvent,
    isKeyup
} from './helpers';
import PartialKeyupMatcher from "./PartialKeyupMatcher";

class KeymapManager {

    partialMatchTimeout = 1000
    defaultTarget = null
    pendingPartialMatches = null
    pendingStateTimeoutHandle = null
    pendingKeyupMatcher = new PartialKeyupMatcher();

    static buildKeyDownEvent(key, options) {
        keydownEvent(key, options);
    }

    static buildKeyUpEvent(key, options) {
        keydownEvent(key, options);
    }

    constructor(options = {}) {
        this.watchSubscriptions = {};
        this.customKeystrokeResolvers = [];
        this.clear();
    }

    clear() {
        this.emitter = new Emitter();
        this.keyBindings = [];
        this.queuedKeyboardEvents = [];
        this.queuedKeyStrokes = [];
        this.bindingsToDisable = [];
    }

    destroy() {
        return;
    }

    onDidMatchBinding(callback) {
        this.emitter.on('did-match-binding', callback);
    }

    onDidPartiallyMatchBinding(callback) {
        this.emitter.on('did-partially-match-binding', callback);
    }

    onDidFailToMatchBinding(callback) {
        this.emitter.on('did-fail-to-match-binding', callback);
    }

    onDidReloadKeymap(callback) {
        this.emitter.on('did-reload-keymap', callback);
    }

    onDidUnloadKeymap(callback) {
        this.emitter.on('did-unload-keymap', callback);
    }

    onDidFailToReadFile(callback) {
        this.emitter.on('did-fail-to-read-file', callback);
    }

    build(source, keyBindingsBySelector, priority = 0, throwOnInvalidSelector = true) {
        const bindings = [];

        for (let selector in keyBindingsBySelector) {
            let keyBindings = keyBindingsBySelector[selector];

            if (throwOnInvalidSelector && !isSelectorValid(selector.replace(/!important/g, ''))) {
                console.warn(`Encountered an invalid selector adding key bindings from '${source}': '${selector}'`);
                continue;
            }

            if (typeof keyBindings !== 'object') {
                console.warn(`Encountered an invalid selector adding key bindings from '${source}': '${selector}'`);
                continue;
            }

            for (let keystrokes in keyBindings) {
                let command = keyBindings[keystrokes];
                command = command.toString() || '';

                if (command.length === 0) {
                    console.warn(`Empty command for binding: ${selector} ${keystrokes} in ${source}`);
                    continue;
                }

                let normalizedKeystrokes = normalizeKeystrokes(keystrokes);
                if (normalizedKeystrokes) {
                    bindings.push(new KeyBinding(source, command, normalizedKeystrokes, selector, priority));
                } else {
                    console.warn(`Invalid keystroke sequence for binding: ${keystrokes}: ${command} in ${source}`);
                }
            }
        }

        return bindings;
    }

    add(source, keyBindingsBySelector, priority = 0, throwOnInvalidSelector = true) {

        const addedKeyBindings = this.build(source, keyBindingsBySelector, priority, throwOnInvalidSelector);
        this.keyBindings.push(...addedKeyBindings);

        return new Disposable(() => {
            for (let keyBinding of addedKeyBindings) {
                const index = this.keyBindings.indexOf(keyBinding);
                if (index === -1) {
                    this.keyBindings.splice(index, 1);
                }
            }
        });
    }

    removeBindingsFromSource(source) {
        this.keyBindings = this.keyBindings.filter((keybinding) => {
            return keybinding.source !== source;
        });
    }

    getKeyBindings() {
        return this.keyBindings.slice();
    }

    loadKeymap(bindingsPath, options = {}) {
        // this.add(keymap, options.priority);
    }

    handleKeyboardEvent(event, props = {}) {

        const {replay, disabledBindings} = props;

        if (event.keyCode === 229 && event.key !== 'Dead') {
            return;
        }

        const keystroke = this.keystrokeForKeyboardEvent(event);

        if (event.type === 'keydown' && this.queuedKeyStrokes.length > 0 && isBareModifier(keystroke)) {
            event.preventDefault();
            return;
        }

        this.queuedKeyStrokes.push(keystroke);
        this.queuedKeyboardEvents.push(event);

        let keystrokes = this.queuedKeyStrokes.join(' ');
        let target = event.target;

        if (target === document.body && this.defaultTarget) {
            target = this.defaultTarget;
        }

        let {
            partialMatchCandidates,
            pendingKeyupMatchCandidates,
            exactMatchCandidates
        } = this.findMatchCandidates(this.queuedKeyStrokes, disabledBindings);

        let dispatchedExactMatch = null;
        let partialMatches = this.findPartialMatches(partialMatchCandidates, target);

        if (this.pendingPartialMatches) {
            let liveMatches = new Set(partialMatches.concat(exactMatchCandidates));
            for (let binding of this.pendingPartialMatches) {
                if (!liveMatches.has(binding)) {
                    this.bindingsToDisable.push(binding);
                }
            }
        }

        let hasPartialMatches = partialMatches.length > 0;
        let shouldUsePartialMatches = hasPartialMatches;

        if (isKeyup(keystroke)) {
            exactMatchCandidates = exactMatchCandidates.concat(this.pendingKeyupMatcher.getMatches(keystroke));
        }

        if (exactMatchCandidates.length > 0) {
            let currentTarget = target;
            let eventHandled = false;

            while (!eventHandled && currentTarget && currentTarget !== document) {

                let exactMatches = this.findExactMatches(exactMatchCandidates, currentTarget);
                for (let i = 0, l = exactMatches.length; i < l; i++) {

                    const exactMatchCandidate = exactMatches[i];

                    // if (exactMatchCandidate.command === 'native!') {
                    //     shouldUsePartialMatches = false;
                    //     eventHandled = true;
                    //     break;
                    // }
                    //
                    // if (exactMatchCandidate.command === 'abort!') {
                    //     event.preventDefault();
                    //     eventHandled = true;
                    //     break;
                    // }
                    //
                    // if (exactMatchCandidate.command === 'unset!') {
                    //     break;
                    // }

                    if (hasPartialMatches) {
                        let allPartialMatchesContainKeyupRemainder = true;
                        for (let partialMatch of partialMatches) {
                            if (pendingKeyupMatchCandidates.indexOf(partialMatch) < 0) {
                                allPartialMatchesContainKeyupRemainder = false;
                                break;
                            }
                        }
                        if (!allPartialMatchesContainKeyupRemainder) {
                            break;
                        }
                    } else {
                        shouldUsePartialMatches = false;
                    }

                    if (this.dispatchCommandEvent(exactMatchCandidate.command, target, event)) {
                        dispatchedExactMatch = exactMatchCandidate;
                        eventHandled = true;

                        for (let pendingKeyupMatch of pendingKeyupMatchCandidates) {
                            this.pendingKeyupMatcher.addPendingMatch(pendingKeyupMatch);
                        }

                        break;
                    }
                }

                currentTarget = currentTarget.parentElement;
            }
        }

        if (dispatchedExactMatch) {
            this.emitter.emit('did-match-binding', {
                eventType: event.type,
                binding: dispatchedExactMatch,
                keyboardEventTarget: target,
            });
        } else if (hasPartialMatches && shouldUsePartialMatches) {
            event.preventDefault();
            this.emitter.emit('did-partially-match-binding', {
                keystrokes,
                eventType: event.type,
                partiallyMatchedBindings: partialMatches,
                keyboardEventTarget: target,
            });
        } else if (!dispatchedExactMatch && !hasPartialMatches) {
            this.emitter.emit('did-fail-to-match-binding', {
                keystrokes,
                eventType: event.type,
                keyboardEventTarget: target,
            });

            if (event.defaultPrevented && event.type === 'keydown') {
                this.simulateTextInput(event);
            }
        }

        if (dispatchedExactMatch) {
            this.bindingsToDisable.push(dispatchedExactMatch);
        }

        if (hasPartialMatches && shouldUsePartialMatches) {
            let enableTimeout = (
                !!this.pendingStateTimeoutHandle ||
                !!dispatchedExactMatch ||
                !!characterForKeyboardEvent(this.queuedKeyboardEvents[0])
            );

            if (replay) {
                enableTimeout = false;
            }

            this.enterPendingState(partialMatches, enableTimeout);
        } else if (dispatchedExactMatch && !hasPartialMatches && this.pendingPartialMatches) {
            this.terminatePendingState();
        } else {
            this.clearQueuedKeystrokes();
        }
    }

    keystrokeForKeyboardEvent(event) {
        return keystrokeForKeyboardEvent(event, this.customKeystrokeResolvers)
    }

    addKeystrokeResolver(resolver) {
        this.customKeystrokeResolvers.push(resolver);
        new Disposable(() => {
            let index = this.customKeystrokeResolvers.indexOf(resolver);
            if (index >= 0) {
                this.customKeystrokeResolvers.splice(index, 1);
            }
        });
    }

    getPartialTimeout() {
        return this.partialMatchTimeout;
    }

    simulateTextInput(keydownEvent) {
        // var character, textInputEvent;
        // if (character = characterForKeyboardEvent(keydownEvent)) {
        // 	textInputEvent = document.createEvent("TextEvent");
        // 	textInputEvent.initTextEvent("textInput", true, true, window, character);
        // 	return keydownEvent.path[0].dispatchEvent(textInputEvent);
        // }
    }

    findMatchCandidates(keystrokeArray, disabledBindings) {
        let partialMatchCandidates = [];
        let exactMatchCandidates = [];
        let pendingKeyupMatchCandidates = [];
        let disabledBindingSet = new Set(disabledBindings);

        for (var i = 0, l = this.keyBindings.length; i < l; i++) {
            const binding = this.keyBindings[i];
            if (disabledBindingSet.has(binding)) {
                continue;
            }
            let doesMatch = binding.matchesKeystrokes(keystrokeArray);

            if (doesMatch === MATCH_TYPES.EXACT) {
                exactMatchCandidates.push(binding);
            } else if (doesMatch === MATCH_TYPES.PARTIAL) {
                partialMatchCandidates.push(binding);
            } else if (doesMatch === MATCH_TYPES.PENDING_KEYUP) {
                partialMatchCandidates.push(binding);
                pendingKeyupMatchCandidates.push(binding);
            }
        }

        return {partialMatchCandidates, pendingKeyupMatchCandidates, exactMatchCandidates};
    }

    findPartialMatches(partialMatchCandidates, target) {
        let partialMatches = [];
        let ignoreKeystrokes = new Set();

        partialMatchCandidates.forEach((binding) => {
            if (binding.command === 'unset!') {
                ingnoreKeystrokes.add(bindings.keystrokes);
            }
        });

        if (target !== document) {
            while (partialMatchCandidates.length > 0) {
                let partialMatchCandidates = partialMatchCandidates.filter((binding) => {
                    if (!ignoreKeystrokes.has(binding.keystrokes) && target.webkitMatchesSelector(binding.selector)) {
                        partialMatches.push(binding);
                        return false;
                    } else {
                        return true;
                    }
                });

                let target = target.parentElement
            }
        }

        return partialMatches.sort((a, b) => b.keystrokeCount - a.keystrokeCount);
    }

    findExactMatches(exactMatchCandidates, target) {
        return exactMatchCandidates.filter((binding) => target.webkitMatchesSelector(binding.selector)).sort((a, b) => a.compare(b));
    }

    clearQueuedKeystrokes() {
        this.queuedKeyboardEvents = [];
        this.queuedKeystrokes = [];
        this.bindingsToDisable = [];
    }

    enterPendingState(pendingPartialMatches, enableTimeout) {
        if (this.pendingStateTimeoutHandle) {
            this.cancelPendingState();
        }

        this.pendingPartialMatches = pendingPartialMatches;

        if (enableTimeout) {
            this.pendingStateTimeoutHandle = setTimeout(this.terminatePendingState.bind(this, true), this.partialMatchTimeout);
        }
    }

    cancelPendingState() {
        clearTimeout(this.pendingStateTimeoutHandle);
        this.pendingStateTimeoutHandle = null;
        this.pendingPartialMatches = null;
    }

    terminatePendingState(fromTimeout) {
        let bindingsToDisable = this.pendingPartialMatches.concat(this.bindingsToDisable);
        let eventsToReplay = this.queuedKeyboardEvents;

        this.cancelPendingState();
        this.clearQueuedKeystrokes();

        let keyEventOptions = {
            replay: true,
            disabledBindings: bindingsToDisable,
        }

        for (event in eventsToReplay) {
            keyEventOptions.disabledBindings = bindingsToDisable;
            this.handleKeyboardEvent(event, keyEventOptions);

            if (bindingsToDisable && !pendingPartialMatches) {
                bindingsToDisable = null
            }
        }

        if (fromTimeout && this.pendingPartialMatches) {
            this.terminatePendingState(true);
        }

        return;
    }

    dispatchCommandEvent(command, target, keyboardEvent) {
        const commandEvent = new CommandEvent(command, {
            bubbles: true,
            cancelable: true
        });

        commandEvent.__proto__ = CommandEvent.prototype;
        commandEvent.originalEvent = keyboardEvent;
        //
        if (document.contains(target)) {
            console.log(target.classList, command)
            target.dispatchEvent(commandEvent)
        } else {
            this.simulateBubblingOnDetachedTarget(target, commandEvent)
        }

        const keyBindingAborted = commandEvent.keyBindingAborted;

        if (!keyBindingAborted) {
            keyboardEvent.preventDefault();
        }

        return !keyBindingAborted;
    }
}

export default KeymapManager;
