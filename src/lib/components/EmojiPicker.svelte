<script lang="ts">
	import * as Popover from "$lib/components/ui/popover";
	import * as InputGroup from "$lib/components/ui/input-group";
	import { cn } from "$lib/utils";
	import { Smile, X, Search } from "lucide-svelte";

	// ── Props ──────────────────────────────────────────────────────────────────

	let {
		value = $bindable(undefined),
	}: {
		value: string | undefined;
	} = $props();

	// ── Emoji data ─────────────────────────────────────────────────────────────

	type EmojiEntry = { h: string; a: string; g: string };

	const GROUP_LABELS: Record<string, string> = {
		"smileys-emotion": "Smileys",
		"people-body": "People",
		"animals-nature": "Animals",
		"food-drink": "Food",
		"travel-places": "Travel",
		activities: "Activities",
		objects: "Objects",
		symbols: "Symbols",
		flags: "Flags",
	};

	let cachedEmojiData: EmojiEntry[] | null = null;

	let popoverOpen = $state(false);
	let allEmoji = $state<EmojiEntry[]>([]);
	let loadState = $state<"idle" | "loading" | "done" | "error">("idle");
	let search = $state("");
	let activeGroup = $state("smileys-emotion");

	$effect(() => {
		if (popoverOpen && loadState === "idle") {
			if (cachedEmojiData) {
				allEmoji = cachedEmojiData;
				loadState = "done";
				return;
			}
			loadState = "loading";
			fetch("/openmoji-data.json")
				.then((r) => r.json())
				.then((data: EmojiEntry[]) => {
					cachedEmojiData = data.filter((e) => GROUP_LABELS[e.g]);
					allEmoji = cachedEmojiData;
					loadState = "done";
				})
				.catch(() => {
					loadState = "error";
				});
		}
	});

	const emojiGroups = $derived(
		Object.keys(GROUP_LABELS).filter((g) => allEmoji.some((e) => e.g === g)),
	);

	const displayedEmoji = $derived(
		search.trim()
			? allEmoji
					.filter((e) => e.a.includes(search.toLowerCase().trim()))
					.slice(0, 300)
			: allEmoji.filter((e) => e.g === activeGroup),
	);

	function selectEmoji(hex: string) {
		value = hex;
		popoverOpen = false;
		search = "";
	}
</script>

<Popover.Root bind:open={popoverOpen}>
	<Popover.Trigger
		class={cn(
			"flex h-12 w-12 shrink-0 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
			value
				? "hover:opacity-80 hover:cursor-pointer hover:border"
				: "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground",
		)}
		aria-label="Choose emoji"
	>
		{#if value}
			<img
				src="/openmoji/{value}.svg"
				alt=""
				class="h-10 w-10 select-none"
				draggable="false"
			/>
		{:else}
			<Smile size={22} />
		{/if}
	</Popover.Trigger>

	<Popover.Content class="w-80 p-3" align="start">
		<!-- Remove button -->
		{#if value}
			<button
				type="button"
				onclick={() => {
					value = undefined;
					popoverOpen = false;
				}}
				class="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
			>
				<X size={12} />
				Remove emoji
			</button>
			<div class="my-2 border-t border-border"></div>
		{/if}

		<!-- Search -->
		<InputGroup.Root>
			<InputGroup.Input
				placeholder="Search emojis…"
				type="text"
				bind:value={search}
			/>
			<InputGroup.Addon>
				<Search />
			</InputGroup.Addon>
		</InputGroup.Root>

		<!-- Group tabs -->
		{#if !search.trim() && loadState === "done"}
			<div class="flex gap-1 overflow-x-auto pb-0.5">
				{#each emojiGroups as g (g)}
					<button
						type="button"
						onclick={() => (activeGroup = g)}
						class={cn(
							"shrink-0 rounded-md px-2.5 py-1 text-xs transition-colors",
							activeGroup === g
								? "bg-primary text-primary-foreground"
								: "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
						)}
					>
						{GROUP_LABELS[g]}
					</button>
				{/each}
			</div>
		{/if}

		<!-- Emoji grid -->
		<div class="h-52 overflow-y-auto">
			{#if loadState === "loading" || loadState === "idle"}
				<div
					class="flex h-full items-center justify-center text-sm text-muted-foreground"
				>
					Loading…
				</div>
			{:else if loadState === "error"}
				<div
					class="flex h-full items-center justify-center text-sm text-destructive"
				>
					Failed to load emoji.
				</div>
			{:else if displayedEmoji.length === 0}
				<div
					class="flex h-full items-center justify-center text-sm text-muted-foreground"
				>
					No results for "{search}"
				</div>
			{:else}
				<div
					class="grid grid-cols-[repeat(auto-fill,minmax(38px,1fr))] gap-0.5"
				>
					{#each displayedEmoji as entry (entry.h)}
						<button
							type="button"
							title={entry.a}
							onclick={() => selectEmoji(entry.h)}
							class={cn(
								"flex h-9 w-9 items-center justify-center rounded transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
								value === entry.h && "bg-accent ring-2 ring-ring",
							)}
						>
							<img
								src="/openmoji/{entry.h}.svg"
								alt={entry.a}
								class="h-7 w-7 select-none"
								loading="lazy"
								draggable="false"
							/>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</Popover.Content>
</Popover.Root>
