<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import PageHeader from '$lib/components/PageHeader.svelte';
</script>

<svelte:head><title>Settings — MakeList</title></svelte:head>

<div class="flex h-full flex-col">
	<PageHeader crumbs={[{ label: 'Settings' }]} />
	<div class="flex-1 overflow-y-auto p-6">
	<div class="max-w-lg space-y-6">
		<section class="rounded-lg border border-border bg-card p-5">
			<h2 class="mb-1 font-medium">Data</h2>
			<p class="text-muted-foreground mb-4 text-sm">Export or import all your data as JSON.</p>
			<div class="flex gap-2">
				<Button variant="outline">Export JSON</Button>
				<Button variant="outline">Import JSON</Button>
			</div>
		</section>

		<section class="rounded-lg border border-destructive/30 bg-card p-5">
			<h2 class="mb-1 font-medium text-destructive">Danger zone</h2>
			<p class="text-muted-foreground mb-4 text-sm">Permanently delete all data. This cannot be undone.</p>
			<Button variant="destructive">Clear all data</Button>
		</section>
	</div>
	</div>
</div>
