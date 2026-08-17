<script lang="ts">
	import { tick, untrack } from 'svelte';
	import ColorPicker from './ColorPicker.svelte';

	let {
		bg: initialBg,
		text: initialText,
		placeholder,
		class: className,
		onSave
	}: {
		bg?: string;
		text?: string;
		placeholder?: string;
		class?: string;
		onSave: (patch: { bgColor?: string; textColor?: string }) => void;
	} = $props();

	let bg = $state(initialBg);
	let text = $state(initialText);
	let open = $state(false);
	// Snapshot of bg/text as of the last open — lets the close handler below tell a real
	// edit apart from "opened and closed without touching anything."
	let snapshot = { bg: initialBg, text: initialText };

	// Plain (non-$state) on purpose — see data-table-media-cell.svelte for why.
	let ready = false;
	tick().then(() => (ready = true));

	// Saves once, on close, rather than on every bg/text change — otherwise dragging the
	// shade slider (which updates bg/text continuously) would save, and toast, per step.
	$effect(() => {
		if (open) {
			untrack(() => (snapshot = { bg, text }));
			return;
		}
		if (!ready) return;
		untrack(() => {
			if (bg === snapshot.bg && text === snapshot.text) return;
			// Untracked — `onSave` may be a fresh closure every time the caller re-renders
			// (e.g. right after this same save triggers a reload); see
			// data-table-media-cell.svelte for the loop that avoids.
			onSave({ bgColor: bg, textColor: text });
		});
	});
</script>

<ColorPicker bind:bg bind:text bind:open {placeholder} class={className} />
