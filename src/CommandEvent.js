class CommandEvent extends CustomEvent {

	keyBindingAborted = false
	propagationStopped = false

	abortKeyBinding() {
		this.stopImmediatePropagation();
		this.keyBindingAborted = true;
	}

	stopPropagation() {
		this.propagationStopped = true;
		super.stopPropagation();
	}

	stopImmediatePropagation() {
		this.propagationStopped = true;
		super.stopImmediatePropagation();
	}
}

export default CommandEvent;
