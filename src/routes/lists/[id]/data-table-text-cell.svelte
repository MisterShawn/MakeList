<script lang="ts">
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import ColorPill from '$lib/components/ColorPill.svelte';

	let {
		value,
		placeholder = '—',
		onSave,
		validate = () => true,
		pillBg,
		pillText
	}: {
		value: string;
		/** Shown in the cell (muted) when value is empty. */
		placeholder?: string;
		onSave: (value: string) => void;
		validate?: (value: string) => boolean;
		/** When set, renders the value as a colored pill (the Title column, for items with an assigned color). */
		pillBg?: string;
		pillText?: string;
	} = $props();

	let open = $state(false);
	let draft = $state(value);
	// Escape marks the pending edit as discarded — bits-ui already closes the popover (and
	// fires onOpenChange) on its own for Escape, so this just tells onOpenChange not to save.
	let cancelled = false;
	let closeButton: HTMLButtonElement | null = null;

	function onOpenChange(next: boolean) {
		open = next;
		if (next) {
			draft = value;
			cancelled = false;
			return;
		}
		if (cancelled) {
			cancelled = false;
			return;
		}
		const trimmed = draft.trim();
		if (trimmed !== value.trim() && validate(trimmed)) onSave(trimmed);
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			// Directly setting `open = false` doesn't route through bits-ui's own close
			// path (and so never fires onOpenChange) — Popover.Close does. Deferred so
			// closing (and the resulting focus-return to the trigger) happens after this
			// same Enter keypress has fully finished, not mid-event — otherwise the
			// trigger receiving focus while Enter is still "live" re-activates it as a
			// button-press, which re-opens the popover it just closed.
			e.preventDefault();
			setTimeout(() => closeButton?.click());
		} else if (e.key === 'Escape') {
			cancelled = true;
		}
	}
</script>

<Popover.Root bind:open {onOpenChange}>
	<Popover.Trigger>
		{#snippet child({ props })}
			<button
				{...props}
				type="button"
				onclick={(e) => {
					e.stopPropagation();
					(props.onclick as ((e: MouseEvent) => void) | undefined)?.(e);
				}}
				class="block w-full truncate rounded-md px-2 py-1 text-left transition-colors hover:bg-muted"
			>
				{#if value}
					<ColorPill bg={pillBg} text={pillText}>{value}</ColorPill>
				{:else}
					<span class="text-muted-foreground">{placeholder}</span>
				{/if}
			</button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-64" onclick={(e) => e.stopPropagation()}>
		<Input bind:value={draft} {onkeydown} />
		<Popover.Close>
			{#snippet child({ props })}
				<button {...props} bind:this={closeButton} class="hidden" tabindex="-1" aria-hidden="true"
				></button>
			{/snippet}
		</Popover.Close>
	</Popover.Content>
</Popover.Root>
