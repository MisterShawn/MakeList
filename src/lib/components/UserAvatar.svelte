<script lang="ts">
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { ALL_ICONS } from '$lib/data/icon-data';
	import type { User } from '$lib/db/types';

	let {
		user,
		class: className
	}: { user: Pick<User, 'name' | 'avatarIcon' | 'avatarEmoji'>; class?: string } = $props();

	const iconEntry = $derived(
		user.avatarIcon ? ALL_ICONS.find((i) => i.name === user.avatarIcon) : undefined
	);
	const initials = $derived(
		user.name
			.split(' ')
			.map((p) => p[0])
			.slice(0, 2)
			.join('')
			.toUpperCase()
	);
</script>

<Avatar.Root class={className}>
	<Avatar.Fallback>
		{#if user.avatarEmoji}
			<span class="text-base leading-none">{user.avatarEmoji}</span>
		{:else if iconEntry}
			<iconEntry.icon class="size-4" />
		{:else}
			{initials}
		{/if}
	</Avatar.Fallback>
</Avatar.Root>
