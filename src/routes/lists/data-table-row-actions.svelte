<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import MoreVerticalIcon from '@lucide/svelte/icons/more-vertical';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';

	let { onDelete }: { onDelete: () => void } = $props();
</script>

<div class="flex justify-end">
	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			{#snippet child({ props })}
				<Button
					{...props}
					variant="ghost"
					size="icon-sm"
					onclick={(e) => {
						e.stopPropagation();
						(props.onclick as ((e: MouseEvent) => void) | undefined)?.(e);
					}}
				>
					<MoreVerticalIcon class="size-4" />
				</Button>
			{/snippet}
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="end">
			<DropdownMenu.Item variant="destructive" onclick={onDelete}>
				<Trash2Icon class="size-4" />
				Trash
			</DropdownMenu.Item>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
</div>
