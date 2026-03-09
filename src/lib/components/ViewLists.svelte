<script lang="ts">
    import { liveQuery } from "dexie";
    import { db } from "$lib/db";
    import Card from "$lib/components/Card.svelte";

    import IconEdit from "~icons/fluent/text-bullet-list-square-edit-24-filled";
    import IconTrash from "~icons/fluent/delete-24-filled";

    let lists = liveQuery(() => db.lists.toArray());

    async function trashList(id: number) {
        await db.lists.update(id, { is_deleted: true });
    }
</script>

<Card type="list">
    {#snippet heading()}
        My Lists
    {/snippet}
    {#if $lists}
        <ul class="list w-full">
            {#each $lists as list (list.id)}
                {#if !list.is_deleted}
                    <li class="list-row">
                        <div class="card-title">
                            {list.name}
                        </div>
                        <div class="card-actions justify-end">
                            <button
                                aria-label="Edit list"
                                class="btn btn-lg btn-square btn-ghost tooltip w-10 h-10 text-blue-500"
                                data-tip="Edit list"><IconEdit /></button
                            >
                            <button
                                aria-label="Send to trash"
                                class="btn btn-lg btn-square btn-ghost tooltip w-10 h-10 text-red-500"
                                data-tip="Send to trash"
                                onclick={() => trashList(list.id)}
                            >
                                <IconTrash /></button
                            >
                        </div>
                    </li>
                {/if}
            {/each}
        </ul>
    {:else}
        <p>Loading database...</p>
    {/if}
</Card>
