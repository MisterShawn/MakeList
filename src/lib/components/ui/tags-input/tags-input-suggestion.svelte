<script lang="ts">
	import { cn } from '$lib/utils.js';

	type Props = {
		id: string;
		value: string;
		active: boolean;
		onSelect: (value: string) => void;
		/** Full Tailwind classes, e.g. "bg-red-500"/"text-white". */
		color?: { bg?: string; text?: string };
	};

	let { id, value, active, onSelect, color }: Props = $props();
</script>

<button
	{id}
	type="button"
	role="option"
	aria-selected={active}
	class={cn(
		'w-full cursor-default rounded-sm px-2 py-1.5 text-left text-sm outline-hidden transition-colors select-none',
		color?.bg || color?.text
			? cn(color.bg, color.text, 'hover:opacity-90 aria-selected:opacity-90')
			: 'hover:bg-accent aria-selected:bg-accent'
	)}
	onmousedown={(e) => {
		e.preventDefault();
		onSelect(value);
	}}
>
	{value}
</button>
