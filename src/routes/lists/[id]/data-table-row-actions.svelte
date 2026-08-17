<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';

	let { onEdit, onDelete }: { onEdit: () => void; onDelete: () => void } = $props();
</script>

<div class="flex items-center justify-end gap-1">
	<Button variant="ghost" size="icon-sm" onclick={onEdit} aria-label="Edit item">
		<PencilIcon class="size-4" />
	</Button>
	<Button
		variant="ghost"
		size="icon-sm"
		class="text-destructive hover:bg-destructive/10"
		onclick={onDelete}
		aria-label="Move to trash"
	>
		<Trash2Icon class="size-4" />
	</Button>
</div>
