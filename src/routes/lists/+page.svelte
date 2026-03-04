<script lang="ts">
	import IconList from "~icons/fluent/text-bullet-list-square-24-filled";
	import IconAdd from "~icons/fluent/add-24-filled";
	import IconEdit from "~icons/fluent/text-bullet-list-square-edit-24-filled";
	import IconDelete from "~icons/fluent/delete-24-filled";
	import IconCancel from "~icons/fluent/arrow-circle-left-24-filled";

	import { db, type List } from "$lib/db";
	import { liveQuery } from "dexie";

	let newListTitle = $state("");
	let lists = liveQuery(() => db.lists.toArray());
	let pendingDelete = $state<any>(null);

	async function addList(event: Event) {
		event.preventDefault();
		if (!newListTitle.trim()) return;

		await db.lists.add({
			title: newListTitle,
			description: "",
			header: "",
			items: "",
			tags: "",
			folder: "",
			created_at: 0,
			updated_at: 0,
		});

		newListTitle = " ";
	}

	async function deleteList() {
		if (!pendingDelete) return;
		await db.lists.delete(pendingDelete.id);
		pendingDelete = null;
	}

	function confirmDelete(list: List) {
		pendingDelete = list;
		(
			document.getElementById("delete_modal") as HTMLDialogElement
		)?.showModal();
	}
</script>

<svelte:head>
	<title>Lists — MakeList</title>
</svelte:head>

<section
	class="min-w-96 bg-base-100 p-4 rounded-2xl border border-base-content/20 shadow-md"
>
	<fieldset class="grid gap-4">
		<legend class="fieldset-legend mb-4 font-medium text-2xl text-center"
			>New List</legend
		>

		<div class="grid gap-2">
			<label for="list_title" class="label"> Title </label>
			<input
				id="list_title"
				type="text"
				bind:value={newListTitle}
				placeholder="My awesome list"
				class="input font-hand"
				required
			/>
			<p class="validator-hint hidden">Required</p>
		</div>

		<div class="grid gap-2">
			<label for="list-items" class="label">Items</label>
			<div class="join">
				<input
					type="text"
					placeholder="Item 1"
					class="input font-hand join-item"
				/>
				<button class="btn btn-square btn-success join-item"
					><IconAdd /></button
				>
			</div>
			<div class="join">
				<span
					class="flex items-center px-2 bg-base-200 border border-base-content/20 join-item"
				>
					<input type="checkbox" class="checkbox" />
				</span>
				<input type="text" class="input font-hand join-item" />
				<button class="btn btn-square text-white bg-red-500 join-item"
					><IconDelete /></button
				>
			</div>
		</div>

		<div class="collapse collapse-arrow bg-base-100 border-base-300 border">
			<input type="checkbox" />
			<div class="collapse-title font-semibold">Extras</div>
			<div class="collapse-content text-sm">
				<label for="list-description" class="label">Description</label>
				<textarea
					name="list-description"
					id="list-description"
					placeholder="Description"
					class="textarea"
				>
				</textarea>
			</div>
		</div>

		<button
			aria-label="Add List"
			class="btn btn-lg text-white btn-primary rounded-xl"
			onclick={addList}>Add List</button
		>
	</fieldset>
</section>
<section class="min-w-96">
	<h2 class="font-medium text-2xl">My Lists</h2>
	<ul class="list bg-base-100 rounded-box shadow-md">
		{#if $lists}
			{#each $lists as list (list.id)}
				<li class="list-row">
					<div class="card-title">
						{list.title}
					</div>
					<div class="card-actions justify-end">
						<button
							aria-label="Edit List"
							class="btn btn-lg btn-square btn-ghost w-10 h-10 text-blue-500"
							><IconEdit /></button
						>
						<button
							aria-label="Delete List"
							class="btn btn-lg btn-square btn-ghost w-10 h-10 text-red-500"
							onclick={() => confirmDelete(list)}
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

<dialog id="delete_modal" class="modal">
	<div class="modal-box grid gap-4 text-center">
		<h3 class="text-xl font-bold">Delete List</h3>
		<p>Permanently delete the following lists:</p>
		<p class="text-lg font-bold">{pendingDelete?.title ?? ""}</p>
		<div class="modal-action w-full">
			<form method="dialog" class="flex w-full justify-between">
				<button class="btn btn-lg btn-error" onclick={deleteList}
					><IconDelete />Delete</button
				>
				<button class="btn btn-lg"><IconCancel />Cancel</button>
			</form>
		</div>
	</div>
</dialog>
