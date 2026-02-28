<script lang="ts">
	import favicon from "$lib/assets/favicon.svg";
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

<header
	class="grid grid-cols-[auto_1fr] gap-8 p-4 col-start-1 col-span-2 row-start-1 border-b-2 border-base-content/10"
>
	<h1 class="flex text-3xl font-semibold">
		<span class="text-indigo-200 leading-[1.15]">Make</span>
		<span class="text-cyan-200 font-hand">List</span>
	</h1>
	{#if breadcrumbs.length}
		<div class="breadcrumbs text-sm">
			<ul>
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
	{/if}
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

<main class="grid grid-rows-[4rem_1fr] col-start-2 row-start-2 bg-base-300 p-8">
	{@render children()}
</main>
