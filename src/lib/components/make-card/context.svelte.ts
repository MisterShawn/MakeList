import { getContext, setContext } from 'svelte';

class MakeCardState {
	hovering = $state(false);
	menuOpen = $state(false);
}

const KEY = Symbol.for('makelist-make-card');

export function setMakeCard(): MakeCardState {
	return setContext(KEY, new MakeCardState());
}

export function useMakeCard(): MakeCardState {
	return getContext(KEY);
}
