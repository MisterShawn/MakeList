<script lang="ts">
	import { tick, untrack } from 'svelte';
	import EmojiPicker from '$lib/components/EmojiPicker.svelte';

	let { value: initial, onSave }: { value?: string; onSave: (value?: string) => void } = $props();

	let value = $state(initial);

	// Plain (non-$state) on purpose — skips the effect's first run (the initial value
	// from the row) without itself becoming a tracked dependency. If this were $state,
	// flipping it true would re-trigger the effect on its own, unconditionally saving
	// the unchanged initial value for every row the moment the table loads.
	let ready = false;
	tick().then(() => (ready = true));

	$effect(() => {
		void value;
		if (!ready) return;
		// Untracked — `onSave` is a fresh closure every time the row re-renders (which
		// includes right after this same save reloads the table), and reading it inside
		// the effect would make that reassignment a dependency, re-triggering this
		// effect (and re-saving the same value) forever.
		untrack(() => onSave(value));
	});
</script>

<!-- eslint-disable-next-line svelte/no-static-element-interactions -->
<div onclick={(e) => e.stopPropagation()} role="presentation">
	<EmojiPicker bind:value placeholder="—" />
</div>
