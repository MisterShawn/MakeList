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
	class="col-span-2 row-start-1 sticky top-0 left-0 z-20 flex items-center gap-8 px-4 h-20 col-start-1 bg-base-100"
>
	<div class="breadcrumbs text-lg pb-0">
		<ul>
			<li class="w-13">
				{@html LogoVar}
			</li>
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
<nav class="sticky w-full row-start-3 z-20 bg-base-100 md:row-start-2 md:w-20">
	<ul
		class="menu auto-cols-fr h-full w-full p-0 md:grid-flow-row md:auto-rows-min"
	>
		<li>
			<a
				class="flex h-20 tooltip tooltip-top items-center justify-center md:tooltip-right"
				aria-label="Recent Work"
				data-tip="Recent"
				href="/"
			>
				<IconRecent class="text-2xl" />
			</a>
		</li>
		<li class="">
			<a
				class="flex h-20 tooltip tooltip-top content-center justify-center md:tooltip-right"
				aria-label="Lists"
				data-tip="Lists"
				href="/lists"
			>
				<IconList class="text-2xl" />
			</a>
		</li>
		<li class="">
			<a
				class="flex h-20 tooltip tooltip-top content-center justify-center md:tooltip-right"
				aria-label="Boards"
				data-tip="Boards"
				href="/boards"
			>
				<IconBoard class="text-2xl" />
			</a>
		</li>
		<li class="flex-1 justify-end">
			<a
				class="flex h-20 tooltip tooltip-top content-center justify-center md:tooltip-right"
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
	class="row-start-2 grid auto-rows-min border-y-2 border-base-content/10 md:col-start-2 md:justify-normal md:flex-row md:border-l-2"
>
	{@html LogoVar}
	{@render children()}
</main>
