<script lang="ts">
	import * as Breadcrumb from '$lib/components/ui/breadcrumb';

	interface Crumb {
		label: string;
		href?: string;
	}

	interface Props {
		crumbs: Crumb[];
		actions?: import('svelte').Snippet;
	}

	let { crumbs, actions }: Props = $props();
</script>

<div class="flex shrink-0 items-center gap-3 border-b border-border px-6 py-4">
	<div class="flex h-8 min-w-0 flex-1 items-center">
		<Breadcrumb.Root class="min-w-0 flex-1">
			<Breadcrumb.List>
				{#each crumbs as crumb, i}
					{#if i > 0}
						<Breadcrumb.Separator />
					{/if}
					<Breadcrumb.Item>
						{#if i < crumbs.length - 1 && crumb.href}
							<Breadcrumb.Link href={crumb.href}>{crumb.label}</Breadcrumb.Link>
						{:else if i === crumbs.length - 1}
							<Breadcrumb.Page class="truncate">{crumb.label}</Breadcrumb.Page>
						{:else}
							<Breadcrumb.Page class="truncate">{crumb.label}</Breadcrumb.Page>
						{/if}
					</Breadcrumb.Item>
				{/each}
			</Breadcrumb.List>
		</Breadcrumb.Root>
	</div>
	{#if actions}
		{@render actions()}
	{/if}
</div>
