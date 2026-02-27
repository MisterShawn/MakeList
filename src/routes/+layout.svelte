<script lang="ts">
	import favicon from "$lib/assets/favicon.svg";
	import IconHome from "~icons/fluent/home-24-filled";
	import IconList from "~icons/fluent/text-bullet-list-square-24-filled";
	import IconBoard from "~icons/fluent/board-24-filled";

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<header class="col-start-1 row-start-1">
	<h1 class="text-4xl">MakeList</h1>
</header>
<nav class="col-start-1 row-start-2">
	<ul class="menu menu-lg bg-base-200 rounded-box">
		<li>
			<a
				class="tooltip tooltip-right"
				aria-label="Home"
				data-tip="Home"
				href="/"
			>
				<IconHome class="text-2xl" />
			</a>
		</li>
		<li>
			<a
				class="tooltip tooltip-right"
				aria-label="Lists"
				data-tip="Lists"
				href="/lists"
			>
				<IconList class="text-2xl" />
			</a>
		</li>
		<li>
			<a
				class="tooltip tooltip-right"
				aria-label="Boards"
				data-tip="Boards"
				href="/boards"
			>
				<IconBoard class="text-2xl" />
			</a>
		</li>
	</ul>
</nav>

<main class="col-start-2 row-start-1 row-span-2">
	{@render children()}
</main>
