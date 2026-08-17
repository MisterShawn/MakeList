<script lang="ts">
	import XIcon from '@lucide/svelte/icons/x';
	import { cn } from '$lib/utils.js';

	type Props = {
		value: string;
		disabled: boolean | null;
		active: boolean;
		onDelete: (value: string) => void;
		/** Full Tailwind classes, e.g. "bg-red-500"/"text-white" — falls back to the
		 *  default secondary chip styling when unset. */
		color?: { bg?: string; text?: string };
	};

	let { value, disabled, onDelete, active, color }: Props = $props();
</script>

<div
	class={cn(
		'flex place-items-center gap-2 rounded-md px-2 py-0.5 ring-offset-background transition-all hover:cursor-default aria-selected:ring-2 aria-selected:ring-ring aria-selected:ring-offset-2',
		color?.bg || color?.text
			? cn(color.bg, color.text, 'hover:opacity-90 aria-selected:opacity-90')
			: 'bg-secondary hover:bg-secondary/90 aria-selected:bg-secondary/90'
	)}
	aria-selected={active}
>
	<span>
		{value}
	</span>
	<button type="button" {disabled} onclick={() => onDelete(value)}>
		<XIcon class="size-4" />
	</button>
</div>
