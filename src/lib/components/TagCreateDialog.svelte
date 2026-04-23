<script lang="ts">
	import { createTag } from '$lib/db/queries';
	import type { Tag } from '$lib/db/schema';
	import ResponsiveDialog from '$lib/components/ResponsiveDialog.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Slider } from '$lib/components/ui/slider';

	// ── Color palette ──────────────────────────────────────────────────────────

	const SHADE_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
	const DEFAULT_SHADE = 5; // index of 500
	const DEFAULT_COLOR_IDX = 7; // Blue

	const COLORS: { name: string; shades: string[] }[] = [
		{ name: 'Red',     shades: ['oklch(97.1% 0.013 17.38)','oklch(93.6% 0.032 17.717)','oklch(88.5% 0.062 18.334)','oklch(80.8% 0.114 19.571)','oklch(70.4% 0.191 22.216)','oklch(63.7% 0.237 25.331)','oklch(57.7% 0.245 27.325)','oklch(50.5% 0.213 27.518)','oklch(44.4% 0.177 26.899)','oklch(39.6% 0.141 25.723)','oklch(25.8% 0.092 26.042)'] },
		{ name: 'Orange',  shades: ['oklch(98% 0.016 73.684)','oklch(95.4% 0.038 75.164)','oklch(90.1% 0.076 70.697)','oklch(83.7% 0.128 66.29)','oklch(75% 0.183 55.934)','oklch(70.5% 0.213 47.604)','oklch(64.6% 0.222 41.116)','oklch(55.3% 0.195 38.402)','oklch(47% 0.157 37.304)','oklch(40.8% 0.123 38.172)','oklch(26.6% 0.079 36.259)'] },
		{ name: 'Amber',   shades: ['oklch(98.7% 0.022 95.277)','oklch(96.2% 0.059 95.617)','oklch(92.4% 0.12 95.746)','oklch(87.9% 0.169 91.605)','oklch(82.8% 0.189 84.429)','oklch(76.9% 0.188 70.08)','oklch(66.6% 0.179 58.318)','oklch(55.5% 0.163 48.998)','oklch(47.3% 0.137 46.201)','oklch(41.4% 0.112 45.904)','oklch(27.9% 0.077 45.635)'] },
		{ name: 'Lime',    shades: ['oklch(98.6% 0.031 120.757)','oklch(96.7% 0.067 122.328)','oklch(93.8% 0.127 124.321)','oklch(89.7% 0.196 126.665)','oklch(84.1% 0.238 128.85)','oklch(76.8% 0.233 130.85)','oklch(64.8% 0.2 131.684)','oklch(53.2% 0.157 131.589)','oklch(45.3% 0.124 130.933)','oklch(40.5% 0.101 131.063)','oklch(27.4% 0.072 132.109)'] },
		{ name: 'Green',   shades: ['oklch(98.2% 0.018 155.826)','oklch(96.2% 0.044 156.743)','oklch(92.5% 0.084 155.995)','oklch(87.1% 0.15 154.449)','oklch(79.2% 0.209 151.711)','oklch(72.3% 0.219 149.579)','oklch(62.7% 0.194 149.214)','oklch(52.7% 0.154 150.069)','oklch(44.8% 0.119 151.328)','oklch(39.3% 0.095 152.535)','oklch(26.6% 0.065 152.934)'] },
		{ name: 'Teal',    shades: ['oklch(98.4% 0.014 180.72)','oklch(95.3% 0.051 180.801)','oklch(91% 0.096 180.426)','oklch(85.5% 0.138 181.071)','oklch(77.7% 0.152 181.912)','oklch(70.4% 0.14 182.503)','oklch(60% 0.118 184.704)','oklch(51.1% 0.096 186.391)','oklch(43.7% 0.078 188.216)','oklch(38.6% 0.063 188.416)','oklch(27.7% 0.046 192.524)'] },
		{ name: 'Cyan',    shades: ['oklch(98.4% 0.019 200.873)','oklch(95.6% 0.045 203.388)','oklch(91.7% 0.08 205.041)','oklch(86.5% 0.127 207.078)','oklch(78.9% 0.154 211.53)','oklch(71.5% 0.143 215.221)','oklch(60.9% 0.126 221.723)','oklch(52% 0.105 223.128)','oklch(45% 0.085 224.283)','oklch(39.8% 0.07 227.392)','oklch(30.2% 0.056 229.695)'] },
		{ name: 'Blue',    shades: ['oklch(97% 0.014 254.604)','oklch(93.2% 0.032 255.585)','oklch(88.2% 0.059 254.128)','oklch(80.9% 0.105 251.813)','oklch(70.7% 0.165 254.624)','oklch(62.3% 0.214 259.815)','oklch(54.6% 0.245 262.881)','oklch(48.8% 0.243 264.376)','oklch(42.4% 0.199 265.638)','oklch(37.9% 0.146 265.522)','oklch(28.2% 0.091 267.935)'] },
		{ name: 'Indigo',  shades: ['oklch(96.2% 0.018 272.314)','oklch(93% 0.034 272.788)','oklch(87% 0.065 274.039)','oklch(78.5% 0.115 274.713)','oklch(67.3% 0.182 276.935)','oklch(58.5% 0.233 277.117)','oklch(51.1% 0.262 276.966)','oklch(45.7% 0.24 277.023)','oklch(39.8% 0.195 277.366)','oklch(35.9% 0.144 278.697)','oklch(25.7% 0.09 281.288)'] },
		{ name: 'Violet',  shades: ['oklch(96.9% 0.016 293.756)','oklch(94.3% 0.029 294.588)','oklch(89.4% 0.057 293.283)','oklch(81.1% 0.111 293.571)','oklch(70.2% 0.183 293.541)','oklch(60.6% 0.25 292.717)','oklch(54.1% 0.281 293.009)','oklch(49.1% 0.27 292.581)','oklch(43.2% 0.232 292.759)','oklch(38% 0.189 293.745)','oklch(28.3% 0.141 291.089)'] },
		{ name: 'Fuchsia', shades: ['oklch(97.7% 0.017 320.058)','oklch(95.2% 0.037 318.852)','oklch(90.3% 0.076 319.62)','oklch(83.3% 0.145 321.434)','oklch(74% 0.238 322.16)','oklch(66.7% 0.295 322.15)','oklch(59.1% 0.293 322.896)','oklch(51.8% 0.253 323.949)','oklch(45.2% 0.211 324.591)','oklch(40.1% 0.17 325.612)','oklch(29.3% 0.136 325.661)'] },
		{ name: 'Pink',    shades: ['oklch(97.1% 0.014 343.198)','oklch(94.8% 0.028 342.258)','oklch(89.9% 0.061 343.231)','oklch(82.3% 0.12 346.018)','oklch(71.8% 0.202 349.761)','oklch(65.6% 0.241 354.308)','oklch(59.2% 0.249 0.584)','oklch(52.5% 0.223 3.958)','oklch(45.9% 0.187 3.815)','oklch(40.8% 0.153 2.432)','oklch(28.4% 0.109 3.907)'] },
		{ name: 'Mauve',   shades: ['oklch(98.5% 0 0)','oklch(96% 0.003 325.6)','oklch(92.2% 0.005 325.62)','oklch(86.5% 0.012 325.68)','oklch(71.1% 0.019 323.02)','oklch(54.2% 0.034 322.5)','oklch(43.5% 0.029 321.78)','oklch(36.4% 0.029 323.89)','oklch(26.3% 0.024 320.12)','oklch(21.2% 0.019 322.12)','oklch(14.5% 0.008 326)'] },
		{ name: 'Mist',    shades: ['oklch(98.7% 0.002 197.1)','oklch(96.3% 0.002 197.1)','oklch(92.5% 0.005 214.3)','oklch(87.2% 0.007 219.6)','oklch(72.3% 0.014 214.4)','oklch(56% 0.021 213.5)','oklch(45% 0.017 213.2)','oklch(37.8% 0.015 216)','oklch(27.5% 0.011 216.9)','oklch(21.8% 0.008 223.9)','oklch(14.8% 0.004 228.8)'] },
		{ name: 'Olive',   shades: ['oklch(98.8% 0.003 106.5)','oklch(96.6% 0.005 106.5)','oklch(93% 0.007 106.5)','oklch(88% 0.011 106.6)','oklch(73.7% 0.021 106.9)','oklch(58% 0.031 107.3)','oklch(46.6% 0.025 107.3)','oklch(39.4% 0.023 107.4)','oklch(28.6% 0.016 107.4)','oklch(22.8% 0.013 107.4)','oklch(15.3% 0.006 107.1)'] },
	];

	// ── Props ──────────────────────────────────────────────────────────────────

	let {
		open = $bindable(false),
		initialName = '',
		oncreate,
	}: {
		open?: boolean;
		initialName?: string;
		oncreate?: (tag: Tag) => void;
	} = $props();

	// ── Form state ─────────────────────────────────────────────────────────────

	let formName = $state('');
	let formColorIdx = $state(DEFAULT_COLOR_IDX);
	let formShadeIdx = $state(DEFAULT_SHADE);
	let saving = $state(false);

	const formColor = $derived(COLORS[formColorIdx].shades[formShadeIdx]);
	const formTextColor = $derived(formShadeIdx <= 3 ? 'black' : 'white');
	const canSave = $derived(formName.trim().length > 0);

	$effect(() => {
		if (open) {
			formName = initialName;
			formColorIdx = DEFAULT_COLOR_IDX;
			formShadeIdx = DEFAULT_SHADE;
		}
	});

	// ── Actions ────────────────────────────────────────────────────────────────

	async function handleSave() {
		if (!canSave || saving) return;
		saving = true;
		try {
			const id = await createTag({ name: formName.trim(), color: formColor });
			const tag: Tag = {
				id,
				name: formName.trim(),
				color: formColor,
				createdAt: new Date(),
			};
			oncreate?.(tag);
			open = false;
		} finally {
			saving = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSave();
		}
	}
</script>

<ResponsiveDialog bind:open title="New tag" class="max-w-sm">
	{#snippet children()}
		<div class="flex flex-col gap-4 py-2">
			<!-- Preview -->
			<div class="flex justify-center">
				<span
					class="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium"
					style="background-color: {formColor}; color: {formTextColor}"
				>
					{formName.trim() || 'Tag name'}
				</span>
			</div>

			<!-- Name -->
			<div class="flex flex-col gap-1.5">
				<Label for="new-tag-name">Name</Label>
				<Input
					id="new-tag-name"
					type="text"
					placeholder="e.g. Favorites"
					bind:value={formName}
					onkeydown={handleKeydown}
				/>
			</div>

			<!-- Color -->
			<div class="flex flex-col gap-2">
				<Label>Color</Label>
				<div class="grid grid-cols-3 gap-1.5">
					{#each COLORS as color, i}
						<button
							type="button"
							onclick={() => (formColorIdx = i)}
							style="background-color: {color.shades[formShadeIdx]}; color: {formShadeIdx <= 3 ? 'black' : 'white'}"
							class="inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-medium transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 {formColorIdx === i ? 'ring-2 ring-ring ring-offset-2' : ''}"
						>
							{color.name}
						</button>
					{/each}
				</div>

				<!-- Shade slider -->
				<div class="flex flex-col gap-1.5 pt-1">
					<div class="flex justify-between text-xs text-muted-foreground">
						<span>Light</span>
						<span>{SHADE_STEPS[formShadeIdx]}</span>
						<span>Dark</span>
					</div>
					<Slider type="single" min={0} max={10} step={1} bind:value={formShadeIdx} />
				</div>
			</div>
		</div>
	{/snippet}
	{#snippet footer()}
		<Button variant="outline" onclick={() => (open = false)}>Cancel</Button>
		<Button onclick={handleSave} disabled={!canSave || saving}>
			{saving ? 'Saving…' : 'Create tag'}
		</Button>
	{/snippet}
</ResponsiveDialog>
