<script lang="ts">
	import * as Popover from '$lib/components/ui/popover/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Slider } from '$lib/components/ui/slider/index.js';
	import { COLOR_HUES, COLOR_SHADES, findSwatch } from '$lib/data/color-data';
	import { cn } from '$lib/utils.js';
	import XIcon from '@lucide/svelte/icons/x';
	import PaletteIcon from '@lucide/svelte/icons/palette';

	let {
		bg = $bindable<string | undefined>(undefined),
		text = $bindable<string | undefined>(undefined),
		open = $bindable(false),
		placeholder = 'Pick colors',
		class: className
	}: {
		/** Full Tailwind class, e.g. "bg-red-500". */
		bg?: string;
		/** Full Tailwind class, e.g. "text-red-500". */
		text?: string;
		/** Exposed so callers can defer side effects (like autosaving) until the popover
		 *  closes, instead of firing on every intermediate value while e.g. the shade
		 *  slider is being dragged. */
		open?: boolean;
		placeholder?: string;
		/** No default size — the trigger fills whatever box you give it via this class. */
		class?: string;
	} = $props();

	// black/white have no shade ramp — they're Tailwind's bare colors, not part of the
	// hue x shade system in color-data.ts — so they're handled as one-off entries here
	// rather than folded into findSwatch.
	const GRID = [
		{ hue: 'black', bg: 'bg-black' },
		{ hue: 'white', bg: 'bg-white' },
		...COLOR_HUES.map((hue) => ({ hue, bg: findSwatch(hue, 500)!.bg }))
	];

	/** Reads the hue + shade back out of a "bg-red-500" / "text-red-500" class string, so
	 *  the grid can highlight the active hue and the slider can show its current shade.
	 *  black/white carry no real shade — the placeholder 500 just satisfies the type;
	 *  the slider is disabled for them regardless. */
	function parseClass(cls: string | undefined): { hue: string; shade: number } | undefined {
		if (!cls) return undefined;
		if (cls === 'bg-black' || cls === 'text-black') return { hue: 'black', shade: 500 };
		if (cls === 'bg-white' || cls === 'text-white') return { hue: 'white', shade: 500 };
		const match = cls.match(/^(?:bg|text)-([a-z]+)-(\d+)$/);
		if (!match) return undefined;
		return { hue: match[1], shade: Number(match[2]) };
	}

	const bgParsed = $derived(parseClass(bg));
	const textParsed = $derived(parseClass(text));

	// Picking a hue always resets to its 500 shade — the slider is what fine-tunes from there.
	function selectHue(kind: 'bg' | 'text', hue: string) {
		if (hue === 'black') {
			if (kind === 'bg') bg = 'bg-black';
			else text = 'text-black';
			return;
		}
		if (hue === 'white') {
			if (kind === 'bg') bg = 'bg-white';
			else text = 'text-white';
			return;
		}
		const swatch = findSwatch(hue, 500);
		if (!swatch) return;
		if (kind === 'bg') bg = swatch.bg;
		else text = swatch.text;
	}

	function setShade(kind: 'bg' | 'text', hue: string, shade: number) {
		const swatch = findSwatch(hue, shade);
		if (!swatch) return;
		if (kind === 'bg') bg = swatch.bg;
		else text = swatch.text;
	}
</script>

{#snippet colorGrid(kind: 'bg' | 'text', parsed: { hue: string; shade: number } | undefined)}
	<div class="space-y-6">
		<div class="grid grid-cols-4 gap-2 md:grid-cols-8">
			{#each GRID as entry (entry.hue)}
				<button
					type="button"
					class={cn(
						'size-8 cursor-pointer rounded-sm border-2 border-border ring-offset-2 ring-offset-popover transition-shadow md:size-10',
						entry.bg,
						parsed?.hue === entry.hue && 'ring-2 ring-ring'
					)}
					aria-label={entry.hue}
					onclick={() => selectHue(kind, entry.hue)}
				></button>
			{/each}
		</div>
		<Slider
			type="single"
			value={parsed?.shade ?? 500}
			step={[...COLOR_SHADES]}
			disabled={!parsed || parsed.hue === 'black' || parsed.hue === 'white'}
			onValueChange={(shade) => parsed && setShade(kind, parsed.hue, shade)}
			class="cursor-ew-resize"
		/>
	</div>
{/snippet}

<Popover.Root bind:open>
	<Popover.Trigger>
		{#snippet child({ props })}
			<Button {...props} variant="ghost" size="icon" class={className}>
				{#if bg || text}
					<span
						class={cn('flex size-full items-center justify-center rounded-md', bg, text)}
					>
						<PaletteIcon class="size-1/2" />
					</span>
				{:else}
					<span class="text-muted-foreground">{placeholder}</span>
				{/if}
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-max p-4">
		<div
			class={cn(
				'flex h-16 items-center justify-center rounded-xl border text-sm font-medium',
				bg,
				text
			)}
		>
			Preview
		</div>

		<Tabs.Root value="bg">
			<Tabs.List class="w-full select-none *:cursor-pointer">
				<Tabs.Trigger value="bg" class="flex-1">Background</Tabs.Trigger>
				<Tabs.Trigger value="text" class="flex-1">Text</Tabs.Trigger>
			</Tabs.List>
			<Tabs.Content value="bg">
				{@render colorGrid('bg', bgParsed)}
			</Tabs.Content>
			<Tabs.Content value="text">
				{@render colorGrid('text', textParsed)}
			</Tabs.Content>
		</Tabs.Root>

		{#if bg || text}
			<Button
				variant="destructive"
				size="lg"
				class="w-full justify-center gap-2"
				onclick={() => {
					bg = undefined;
					text = undefined;
				}}
			>
				<XIcon class="size-4" />
				Reset
			</Button>
		{/if}
	</Popover.Content>
</Popover.Root>
