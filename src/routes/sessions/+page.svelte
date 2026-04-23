<script lang="ts">
	import PageHeader from '$lib/components/PageHeader.svelte';
</script>

<svelte:head><title>Sessions — MakeList</title></svelte:head>

<div class="flex h-full flex-col">
	<PageHeader crumbs={[{ label: 'Sessions' }]} />
	<div class="flex-1 overflow-y-auto p-6">
		<p class="text-muted-foreground text-sm">Session history will appear here.</p>
	</div>
</div>
