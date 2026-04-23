<script lang="ts">
	import type { Snippet } from 'svelte';
	import * as Drawer from '$lib/components/ui/drawer';
	import { Button } from '$lib/components/ui/button';
	import { X } from 'lucide-svelte';

	let {
		open,
		selectedCount,
		onclose,
		children,
	}: {
		open: boolean;
		selectedCount: number;
		onclose: () => void;
		children?: Snippet;
	} = $props();
</script>

<Drawer.Root
	{open}
	modal={false}
	shouldScaleBackground={false}
	onOpenChange={(v) => { if (!v) onclose(); }}
>
	<Drawer.Content
		portalProps={{ to: 'main[data-slot="sidebar-inset"]' }}
		class="absolute flex-row items-center gap-2 rounded-none border-t px-6 py-4 shadow-none
		       data-[vaul-drawer-direction=bottom]:mt-0
		       data-[vaul-drawer-direction=bottom]:max-h-none
		       data-[vaul-drawer-direction=bottom]:rounded-none
		       [&>div:first-child]:hidden"
	>
		<span class="text-sm text-muted-foreground">{selectedCount} selected</span>
		{@render children?.()}
		<Button variant="ghost" size="icon-sm" class="ml-auto" onclick={onclose} aria-label="Clear selection">
			<X size={14} />
		</Button>
	</Drawer.Content>
</Drawer.Root>
