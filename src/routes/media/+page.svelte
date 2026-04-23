<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Upload } from 'lucide-svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
</script>

<svelte:head><title>Media — MakeList</title></svelte:head>

<div class="flex h-full flex-col">
	<PageHeader crumbs={[{ label: 'Media' }]}>
		{#snippet actions()}
			<Button size="sm">
				<Upload size={14} /> Upload
			</Button>
		{/snippet}
	</PageHeader>
	<div class="flex-1 overflow-y-auto p-6">
		<p class="text-muted-foreground text-sm">Media assets will appear here.</p>
	</div>
</div>
