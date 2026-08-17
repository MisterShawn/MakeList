<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import ArrowUpDownIcon from '@lucide/svelte/icons/arrow-up-down';

	let { label, onSortToggle }: { label: string; onSortToggle?: (e: unknown) => void } = $props();
</script>

<Button variant="ghost" size="sm" class="-ms-3 gap-1.5" onclick={(e) => onSortToggle?.(e)}>
	{label}
	<ArrowUpDownIcon class="size-3.5" />
</Button>
