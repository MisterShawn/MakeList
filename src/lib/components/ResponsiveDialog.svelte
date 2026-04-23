<script lang="ts">
	import type { Snippet } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Drawer from '$lib/components/ui/drawer';

	let {
		open = $bindable(false),
		title,
		description,
		class: contentClass,
		children,
		footer,
	}: {
		open?: boolean;
		title: string;
		description?: string;
		class?: string;
		children: Snippet;
		footer?: Snippet;
	} = $props();

	const isDesktop = new MediaQuery('(min-width: 640px)');
</script>

{#if isDesktop.current}
	<Dialog.Root bind:open>
		<Dialog.Content class={contentClass}>
			<Dialog.Header>
				<Dialog.Title>{title}</Dialog.Title>
				{#if description}
					<Dialog.Description>{description}</Dialog.Description>
				{/if}
			</Dialog.Header>

			{@render children()}

			{#if footer}
				<Dialog.Footer>
					{@render footer()}
				</Dialog.Footer>
			{/if}
		</Dialog.Content>
	</Dialog.Root>
{:else}
	<Drawer.Root bind:open>
		<Drawer.Content>
			<Drawer.Header class="text-left">
				<Drawer.Title>{title}</Drawer.Title>
				{#if description}
					<Drawer.Description>{description}</Drawer.Description>
				{/if}
			</Drawer.Header>

			<div class="px-4">
				{@render children()}
			</div>

			{#if footer}
				<Drawer.Footer>
					{@render footer()}
				</Drawer.Footer>
			{/if}
		</Drawer.Content>
	</Drawer.Root>
{/if}
