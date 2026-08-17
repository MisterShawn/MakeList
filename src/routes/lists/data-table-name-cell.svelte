<script lang="ts">
	let { name, description }: { name: string; description?: string } = $props();
</script>

<div class="min-w-0">
	<p class="truncate font-medium">{name}</p>
	{#if description}
		<p class="truncate text-sm text-muted-foreground">{description}</p>
	{/if}
</div>
