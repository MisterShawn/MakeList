<script lang="ts">
	import "../app.css";
	import ProgressBar from "$lib/components/ProgressBar.svelte";

	import favicon from "$lib/assets/favicon.svg";
	import logo from "$lib/assets/MakeListLogo.svg";
	import LogoVar from "$lib/assets/MakeListLogoVar.svg?raw";
	import IconRecent from "~icons/fluent/clock-24-filled";
	import IconList from "~icons/fluent/text-bullet-list-square-24-filled";
	import IconBoard from "~icons/fluent/board-24-filled";
	import IconSettings from "~icons/fluent/settings-24-filled";
	import IconFolder from "~icons/fluent/folder-24-filled";
	import IconNewDoc from "~icons/fluent/document-add-24-filled";

	import { page } from "$app/state";

	let breadcrumbs = $derived.by(() => {
		const pathArray = page.url.pathname
			.split("/")
			.filter((path) => path !== "");

		return pathArray.map((path, index) => {
			const href = "/" + pathArray.slice(0, index + 1).join("/");
			return {
				label:
					path.charAt(0).toUpperCase() +
					path.slice(1).replace(/-/g, " "),
				href,
			};
		});
	});

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<ProgressBar />

<header
	class="sticky top-0 z-20 flex items-center mt-1 gap-8 px-4 h-20 col-start-2 row-start-1 bg-base-100 border-b-2 border-base-content/10"
>
	<div class="breadcrumbs text-lg pb-0">
		<ul>
			{#if !breadcrumbs.length}
				<li>
					<a href="/">
						<IconRecent />
						Recent
					</a>
				</li>
			{/if}
			{#each breadcrumbs as crumb}
				<li>
					<a href={crumb.href}>
						{#if crumb.label === "Lists"}
							<IconList />
						{:else if crumb.label === "Boards"}
							<IconBoard />
						{:else if crumb.label === "Settings"}
							<IconSettings />
						{/if}
						{crumb.label}
					</a>
				</li>
			{/each}
		</ul>
	</div>
</header>
<nav
	class="fixed top-0 h-dvh w-20 mt-1 bg-base-100 col-start-1 row-start-2 z-20"
>
	<ul
		class="h-full w-full flex-nowrap menu menu-lg p-0 border-r-2 border-base-content/10"
	>
		<li id="logo" class="h-20 border-b-2 border-base-content/10">
			{@html LogoVar}
		</li>
		<li class="border-b-2 border-base-content/10">
			<a
				class="tooltip tooltip-right p-4 justify-center"
				aria-label="Recent Work"
				data-tip="Recent"
				href="/"
			>
				<IconRecent class="text-2xl" />
			</a>
		</li>
		<li>
			<a
				class="tooltip tooltip-right p-4 justify-center"
				aria-label="Lists"
				data-tip="Lists"
				href="/lists"
			>
				<IconList class="text-2xl" />
			</a>
		</li>
		<li class="flex-1">
			<a
				class="tooltip tooltip-right p-4 justify-center"
				aria-label="Boards"
				data-tip="Boards"
				href="/boards"
			>
				<IconBoard class="text-2xl" />
			</a>
		</li>
		<li class="border-t-2 border-base-content/10">
			<a
				class="tooltip tooltip-right p-4 justify-center"
				aria-label="Settings"
				data-tip="Settings"
				href="/settings"
			>
				<IconSettings class="text-2xl" />
			</a>
		</li>
	</ul>
</nav>

<main
	class="col-start-2 row-start-2 w-full flex flex-wrap justify-center content-start gap-8 p-4 sm:p-8 md:justify-normal md:flex-row"
>
	{@html LogoVar}
	{@render children()}
</main>
