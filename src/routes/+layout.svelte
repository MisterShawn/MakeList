<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import ScrollTextIcon from '@lucide/svelte/icons/scroll-text';
	import ListChecksIcon from '@lucide/svelte/icons/list-checks';
	import ImagesIcon from '@lucide/svelte/icons/images';
	import GamepadIcon from '@lucide/svelte/icons/gamepad-2';
	import UsersIcon from '@lucide/svelte/icons/users';
	import TagsIcon from '@lucide/svelte/icons/tags';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import SettingsIcon from '@lucide/svelte/icons/settings';

	let { children } = $props();

	const homeHref = resolve('/');
	const mainNavItems = [
		{ href: resolve('/lists'), label: 'Lists', icon: ListChecksIcon },
		{ href: resolve('/activities'), label: 'Activities', icon: GamepadIcon },
		{ href: resolve('/users'), label: 'Users', icon: UsersIcon },
		{ href: resolve('/media'), label: 'Media', icon: ImagesIcon },
		{ href: resolve('/tags'), label: 'Tags', icon: TagsIcon }
	];
	const footerNavItems = [
		{ href: resolve('/trash'), label: 'Trash', icon: Trash2Icon },
		{ href: resolve('/settings'), label: 'Settings', icon: SettingsIcon }
	];
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<Sidebar.Provider>
	<Sidebar.Root collapsible="icon" class="*:bg-background">
		<Sidebar.Header>
			<Sidebar.Menu>
				<Sidebar.MenuItem>
					<Sidebar.MenuButton size="lg" class="group-data-[collapsible=icon]:justify-center">
						{#snippet child({ props })}
							<a href={homeHref} {...props}>
								<ScrollTextIcon class="size-4" />
								<span class="truncate font-semibold group-data-[collapsible=icon]:hidden">
									Makelist
								</span>
							</a>
						{/snippet}
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			</Sidebar.Menu>
		</Sidebar.Header>
		<Sidebar.Content>
			<Sidebar.Group>
				<Sidebar.GroupContent>
					<Sidebar.Menu>
						{#each mainNavItems as item (item.href)}
							<Sidebar.MenuItem>
								<Sidebar.MenuButton
									isActive={page.url.pathname.startsWith(item.href)}
									tooltipContent={item.label}
								>
									{#snippet child({ props })}
										<a href={item.href} {...props}>
											<item.icon />
											<span>{item.label}</span>
										</a>
									{/snippet}
								</Sidebar.MenuButton>
							</Sidebar.MenuItem>
						{/each}
					</Sidebar.Menu>
				</Sidebar.GroupContent>
			</Sidebar.Group>
		</Sidebar.Content>
		<Sidebar.Footer>
			<Sidebar.Menu>
				{#each footerNavItems as item (item.href)}
					<Sidebar.MenuItem>
						<Sidebar.MenuButton
							isActive={page.url.pathname.startsWith(item.href)}
							tooltipContent={item.label}
						>
							{#snippet child({ props })}
								<a href={item.href} {...props}>
									<item.icon />
									<span>{item.label}</span>
								</a>
							{/snippet}
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
				{/each}
			</Sidebar.Menu>
		</Sidebar.Footer>
		<Sidebar.Rail />
	</Sidebar.Root>
	<Sidebar.Inset class="bg-primary-foreground">
		<header class="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-background pl-2">
			<Sidebar.Trigger />
		</header>
		<main class="w-full max-w-7xl min-w-[28ch] flex-1 p-4">
			{@render children()}
		</main>
	</Sidebar.Inset>
</Sidebar.Provider>

<Toaster />
