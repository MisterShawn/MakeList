<script lang="ts">
	import IconList from "~icons/fluent/text-bullet-list-square-24-filled";
	import IconAdd from "~icons/fluent/add-24-filled";
	import IconEdit from "~icons/fluent/text-bullet-list-square-edit-24-filled";
	import IconDelete from "~icons/fluent/delete-24-filled";

	import { db } from "$lib/db";
	import { liveQuery } from "dexie";

	let newListTitle = $state("");

	let lists = liveQuery(() => db.lists.toArray());

	async function addList(event: Event) {
		event.preventDefault();
		if (!newListTitle.trim()) return;

		await db.lists.add({
			title: newListTitle,
			header: "",
			text: "",
			tags: "",
			folder: "",
			created_at: 0,
			updated_at: 0,
		});

		newListTitle = " ";
	}

	async function deleteList(id: number) {
		await db.lists.delete(id);
	}
</script>

<svelte:head>
	<title>Lists — MakeList</title>
</svelte:head>

<section>
	<h1 class="font-hand font-medium text-2xl">New List</h1>

	<form class="flex gap-2 mb-4" onsubmit={addList}>
		<input
			type="text"
			bind:value={newListTitle}
			placeholder=""
			class="flex-1 input input-lg"
		/>
		<button
			aria-label="Add List"
			class="btn btn-square btn-lg text-white bg-green-500"
			type="submit"><IconAdd /></button
		>
	</form>

	<ul class="list w-96 bg-base-100 rounded-box shadow-md">
		{#if $lists}
			{#each $lists as list (list.id)}
				<li class="list-row">
					<div class="card-title">
						{list.title}
					</div>
					<div class="card-actions justify-end">
						<button
							aria-label="Edit List"
							class="btn btn-lg btn-square btn-ghost text-blue-500"
							><IconEdit /></button
						>
						<button
							aria-label="Delete List"
							class="btn btn-lg btn-square btn-ghost text-red-500"
							onclick={() => deleteList(list.id!)}
							><IconDelete /></button
						>
					</div>
				</li>
			{/each}
		{:else}
			<p>Loading database...</p>
		{/if}
	</ul>
</section>
