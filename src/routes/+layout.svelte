<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import { initTheme, setTheme, getStoredTheme } from '$lib/stores/theme';
	import type { Theme } from '$lib/stores/theme';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import MobileCloseSidebar from '$lib/components/MobileCloseSidebar.svelte';
	import GlobalSearch from '$lib/components/GlobalSearch.svelte';
	import { Toaster } from '$lib/components/ui/sonner';
	import { liveQuery } from 'dexie';
	import { getNavCounts, ensureGuestPlayer } from '$lib/db/queries';
	import {
		LayoutDashboard,
		List,
		LayoutGrid,
		Users,
		History,
		Tags,
		Image,
		Trash2,
		Settings,
		HelpCircle,
		Sun,
		Moon
	} from 'lucide-svelte';

	let { children } = $props();

	type NavCounts = Awaited<ReturnType<typeof getNavCounts>>;
	let counts = $state<NavCounts | null>(null);

	$effect(() => {
		const sub = liveQuery(() => getNavCounts()).subscribe({
			next: (v) => { counts = v; },
			error: (e) => console.error(e)
		});
		return () => sub.unsubscribe();
	});

	const isXl = new MediaQuery('(min-width: 1280px)');
	let sidebarOpen = $state(true);
	$effect(() => { sidebarOpen = isXl.current; });

	let theme = $state<Theme>('system');

	onMount(() => {
		initTheme();
		theme = getStoredTheme();
		ensureGuestPlayer();
	});

	function cycleTheme() {
		const next: Theme = theme === 'dark' ? 'light' : 'dark';
		theme = next;
		setTheme(next);
	}

	const nav = [
		{ href: '/', label: 'Home', icon: LayoutDashboard },
		{ href: '/lists', label: 'Lists', icon: List, countKey: 'lists' },
		{ href: '/boards', label: 'Boards', icon: LayoutGrid, countKey: 'boards' },
		{ href: '/players', label: 'Players', icon: Users, countKey: 'players' },
		{ href: '/sessions', label: 'Sessions', icon: History, countKey: 'sessions' },
		{ href: '/tags', label: 'Tags', icon: Tags, countKey: 'tags' },
		{ href: '/media', label: 'Media', icon: Image, countKey: 'media' },
		{ href: '/trash', label: 'Trash', icon: Trash2, countKey: 'trash' }
	];

	const bottomNav = [
		{ href: '/settings', label: 'Settings', icon: Settings },
		{ href: '/help', label: 'Help', icon: HelpCircle }
	];

	function isActive(href: string) {
		if (href === '/') return page.url.pathname === '/';
		return page.url.pathname.startsWith(href);
	}
</script>

<Toaster richColors />
<Sidebar.Provider bind:open={sidebarOpen}>
	<MobileCloseSidebar />
	<Sidebar.Root collapsible="icon">
		<!-- Header: logo -->
		<Sidebar.Header>
			<div class="flex h-10 items-center px-2">
				<span class="truncate text-base font-semibold tracking-tight group-data-[collapsible=icon]:hidden">MakeList</span>
			</div>
		</Sidebar.Header>

		<!-- Main nav -->
		<Sidebar.Content>
			<Sidebar.Group>
				<Sidebar.Menu>
					{#each nav as item}
						<Sidebar.MenuItem>
							<Sidebar.MenuButton isActive={isActive(item.href)} tooltipContent={item.label}>
								{#snippet child({ props })}
									<a href={item.href} {...props}>
										<item.icon />
										<span>{item.label}</span>
									</a>
								{/snippet}
							</Sidebar.MenuButton>
							{#if item.countKey && counts && counts[item.countKey as keyof NavCounts] > 0}
								<Sidebar.MenuBadge>{counts[item.countKey as keyof NavCounts]}</Sidebar.MenuBadge>
							{/if}
						</Sidebar.MenuItem>
					{/each}
				</Sidebar.Menu>
			</Sidebar.Group>
		</Sidebar.Content>

		<!-- Footer: settings, help, theme toggle -->
		<Sidebar.Footer>
			<Sidebar.Menu>
				{#each bottomNav as item}
					<Sidebar.MenuItem>
						<Sidebar.MenuButton isActive={isActive(item.href)} tooltipContent={item.label}>
							{#snippet child({ props })}
								<a href={item.href} {...props}>
									<item.icon />
									<span>{item.label}</span>
								</a>
							{/snippet}
						</Sidebar.MenuButton>
					</Sidebar.MenuItem>
				{/each}
				<Sidebar.MenuItem>
					<Sidebar.MenuButton onclick={cycleTheme} tooltipContent={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}>
						{#if theme === 'dark'}
							<Moon />
							<span>Dark</span>
						{:else}
							<Sun />
							<span>Light</span>
						{/if}
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			</Sidebar.Menu>
		</Sidebar.Footer>
	</Sidebar.Root>

	<!-- Main content area -->
	<Sidebar.Inset>
		<header class="flex h-12 shrink-0 items-center gap-2 border-b border-border px-4">
			<Sidebar.Trigger class="-ml-1" />
			<div class="ml-auto">
				<GlobalSearch />
			</div>
		</header>
		<main class="flex-1 overflow-y-auto">
			{@render children()}
		</main>
	</Sidebar.Inset>
</Sidebar.Provider>
