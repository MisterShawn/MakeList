<script lang="ts">
    import { liveQuery } from "dexie";
    import { db } from "$lib/db";
    import Card from "$lib/components/Card.svelte";

    import IconEdit from "~icons/fluent/text-bullet-list-square-edit-24-regular";
    import IconFolderMove from "~icons/fluent/folder-arrow-right-24-regular";
    import IconTrash from "~icons/fluent/delete-24-regular";

    let lists = liveQuery(() => db.lists.toArray());

    async function trashList(id: number) {
        await db.lists.update(id, { is_deleted: true });
    }
</script>

<Card type="list">
    {#snippet heading()}
        My Lists
    {/snippet}
    <div class="w-full">
        <ul
            class="menu menu-horizontal w-full justify-end bg-base-300 rounded-box"
        >
            <li>
                <button
                    aria-label="Move to folder"
                    class="btn btn-lg btn-square btn-ghost tooltip w-10 h-10"
                    data-tip="Move to folder"><IconFolderMove /></button
                >
            </li>
            <button
                aria-label="Send to trash"
                class="btn btn-lg btn-square btn-ghost tooltip w-10 h-10"
                data-tip="Send to trash"
            >
                <IconTrash /></button
            >
        </ul>
        {#if $lists}
            <ul class="list w-full">
                {#each $lists as list (list.id)}
                    {#if !list.is_deleted}
                        <li class="list-row">
                            <input type="checkbox" class="checkbox" />
                            <div class="card-title">
                                {list.name}
                            </div>
                            <div class="list-actions">
                                <button
                                    aria-label="Move to folder"
                                    class="btn btn-lg btn-square btn-ghost tooltip w-10 h-10"
                                    data-tip="Move to folder"
                                    ><IconFolderMove /></button
                                >
                                <button
                                    aria-label="Send to trash"
                                    class="btn btn-lg btn-square btn-ghost tooltip w-10 h-10"
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
    </div>
</Card>

<style lang="postcss">
    @import "tailwindcss";
    @plugin "daisyui";

    .list-row:hover {
        @apply shadow bg-base-100 bg-linear-to-b from-base-100 to-secondary/10;
    }

    .list-row:hover .list-actions {
        @apply opacity-100;
    }

    .list-actions {
        @apply opacity-0 justify-end;
    }

    li:has(input[type="checkbox"]:checked) {
        @apply bg-secondary/5;
    }
</style>
