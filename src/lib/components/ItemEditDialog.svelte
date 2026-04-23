<script lang="ts">
	import { MediaQuery } from "svelte/reactivity";
	import type { Item } from "$lib/db/schema";
	import * as Dialog from "$lib/components/ui/dialog";
	import * as Drawer from "$lib/components/ui/drawer";
	import * as Card from "$lib/components/ui/card";
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Textarea } from "$lib/components/ui/textarea";
	import { Trash2 } from "lucide-svelte";
	import EmojiPicker from "$lib/components/EmojiPicker.svelte";
	import ColorPicker from "$lib/components/ColorPicker.svelte";

	// ── Props ──────────────────────────────────────────────────────────────────

	let {
		item,
		open = $bindable(false),
		onsave,
		ondelete,
	}: {
		item: Item | null;
		open: boolean;
		onsave: (id: number, updates: Partial<Item>) => Promise<void>;
		ondelete?: () => void;
	} = $props();

	const isDesktop = new MediaQuery("(min-width: 640px)");

	// ── Form state ─────────────────────────────────────────────────────────────

	const DEFAULT_COLOR = 'oklch(62.3% 0.214 259.815)'; // Blue-500

	let formText = $state("");
	let formSubtext = $state("");
	let formEmoji = $state<string | undefined>(undefined);
	let formColor = $state<string | undefined>(undefined);
	let saving = $state(false);

	$effect.pre(() => {
		if (open && item) {
			formText = item.text;
			formSubtext = item.subtext ?? "";
			formEmoji = item.emojiId;
			formColor = item.color;
		}
	});

	const canSave = $derived(formText.trim().length > 0);

	async function handleSave() {
		if (!canSave || saving || !item) return;
		saving = true;
		try {
			await onsave(item.id!, {
				text: formText.trim(),
				subtext: formSubtext.trim() || undefined,
				emojiId: formEmoji,
				color: formColor,
			});
			open = false;
		} finally {
			saving = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSave();
		}
	}
</script>

<!-- ── Shared body ───────────────────────────────────────────────────────────── -->

{#snippet dialogBody()}
	<Card.Root>
		<Card.Content class="flex flex-col items-center gap-4 py-4">
			<div class="flex items-center gap-3">
				<EmojiPicker bind:value={formEmoji} />
				{#if formColor}
					<ColorPicker bind:value={formColor} />
					<Button variant="ghost" size="sm" class="h-7 text-xs text-muted-foreground" onclick={() => (formColor = undefined)}>
						Remove color
					</Button>
				{:else}
					<Button variant="outline" size="sm" class="h-7 text-xs" onclick={() => (formColor = DEFAULT_COLOR)}>
						Add color
					</Button>
				{/if}
			</div>

			<!-- Inline text inputs -->
			<div class="w-full grid gap-4">
				<Input
					type="text"
					bind:value={formText}
					onkeydown={handleKeydown}
					placeholder="Item name"
					class="text-center text-xl font-medium"
				/>
				<Textarea
					bind:value={formSubtext}
					onkeydown={handleKeydown}
					placeholder="Add a description…"
					class="text-center resize-none"
				/>
			</div>
		</Card.Content>
	</Card.Root>
{/snippet}

<!-- ── Dialog (desktop) ─────────────────────────────────────────────────────── -->

{#if isDesktop.current}
	<Dialog.Root bind:open>
		<Dialog.Content class="sm:max-w-md">
			<Dialog.Header>
				<Dialog.Title>Edit item</Dialog.Title>
			</Dialog.Header>
			{@render dialogBody()}
			<Dialog.Footer>
				{#if ondelete}
					<Button
						variant="destructive"
						class="sm:mr-auto"
						onclick={() => { ondelete!(); open = false; }}
					>
						<Trash2 size={14} />
						Delete
					</Button>
				{/if}
				<Button variant="outline" onclick={() => (open = false)}>Cancel</Button>
				<Button onclick={handleSave} disabled={!canSave || saving}>
					{saving ? "Saving…" : "Save"}
				</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>

	<!-- ── Drawer (mobile) ──────────────────────────────────────────────────────── -->
{:else}
	<Drawer.Root bind:open>
		<Drawer.Content>
			<Drawer.Header class="text-left">
				<Drawer.Title>Edit item</Drawer.Title>
			</Drawer.Header>
			<div class="px-4">
				{@render dialogBody()}
			</div>
			<Drawer.Footer class="pt-2">
				<Button onclick={handleSave} disabled={!canSave || saving}>
					{saving ? "Saving…" : "Save"}
				</Button>
				<Button variant="outline" onclick={() => (open = false)}>Cancel</Button>
				{#if ondelete}
					<Button
						variant="destructive"
						onclick={() => { ondelete!(); open = false; }}
					>
						<Trash2 size={14} />
						Delete
					</Button>
				{/if}
			</Drawer.Footer>
		</Drawer.Content>
	</Drawer.Root>
{/if}
