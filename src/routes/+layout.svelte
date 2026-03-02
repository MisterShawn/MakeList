<script lang="ts">
	import favicon from "$lib/assets/favicon.svg";
	import logo from "$lib/assets/MakeListLogo.svg";
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

<div id="loading-bar" class="flex h-1 w-full absolute bg-base-300">
	<div
		class="w-full bg-linear-to-r/shorter from-primary from-30% via-accent to-secondary to-70%"
	></div>
</div>

<header
	class="flex gap-8 px-3 py-5 col-start-1 col-span-2 row-start-1 border-b-2 border-base-content/10"
>
	<img id="logo" class="h-8" src={logo} alt="MakeList logo" />

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
<nav class="col-start-1 row-start-2">
	<ul class="h-full menu menu-lg p-0 border-r-2 border-base-content/10">
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
	class="grid content-center justify-center col-start-2 row-start-2 bg-base-300 p-8"
>
	{@render children()}
</main>
