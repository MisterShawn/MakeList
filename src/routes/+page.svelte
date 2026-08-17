<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import * as Card from '$lib/components/ui/card/index.js';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import * as MakeCard from '$lib/components/make-card/index.js';
	import * as q from '$lib/db/queries';
	import ListChecksIcon from '@lucide/svelte/icons/list-checks';
	import GamepadIcon from '@lucide/svelte/icons/gamepad-2';
	import UsersIcon from '@lucide/svelte/icons/users';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';

	let listCount = $state(0);
	let activityCount = $state(0);
	let userCount = $state(0);

	onMount(async () => {
		const [lists, activities, users] = await Promise.all([
			q.listActiveLists(),
			q.listActiveActivities(),
			q.listActiveUsers()
		]);
		listCount = lists.length;
		activityCount = activities.length;
		userCount = users.length;
	});

	const quickLinks = [
		{
			href: resolve('/lists'),
			title: 'Lists',
			description: 'Build and organize collections of items.',
			icon: ListChecksIcon,
			count: () => listCount
		},
		{
			href: resolve('/activities'),
			title: 'Activities',
			description: 'Flash cards, quizzes, matching, and more.',
			icon: GamepadIcon,
			count: () => activityCount
		},
		{
			href: resolve('/users'),
			title: 'Users',
			description: 'Track progress for each learner.',
			icon: UsersIcon,
			count: () => userCount
		}
	];
</script>

<div class="space-y-6">
	<div>
		<h1 class="text-2xl font-semibold">Welcome to Makelist</h1>
		<p class="text-muted-foreground">
			Build lists of items, then turn them into learning activities.
		</p>
	</div>

	<div class="grid gap-4 sm:grid-cols-3">
		{#each quickLinks as link (link.href)}
			<MakeCard.Root href={link.href}>
				<MakeCard.Menu icon={link.icon} />
				<Card.Header class="pr-8">
					<Card.Title>{link.title}</Card.Title>
				</Card.Header>
				<Card.Content class="flex-1">
					<Card.Description>{link.description}</Card.Description>
				</Card.Content>
				<Card.Footer>
					<div class="flex w-full items-center justify-between">
						<span class="text-sm text-muted-foreground">{link.count()}</span>
						<span class={buttonVariants({ variant: 'ghost', size: 'sm', class: 'gap-1.5' })}>
							Open
							<ArrowRightIcon class="size-4" />
						</span>
					</div>
				</Card.Footer>
			</MakeCard.Root>
		{/each}
	</div>
</div>
