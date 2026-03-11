<script lang="ts">
    import { liveQuery } from "dexie";
    import { db } from "$lib/db";
    import Card from "$lib/components/Card.svelte";

    import IconNew from "~icons/fluent/add-square-24-filled";
    import IconEdit from "~icons/fluent/text-bullet-list-square-edit-24-regular";
    import IconFolderMove from "~icons/fluent/folder-arrow-right-24-regular";
    import IconTrash from "~icons/fluent/delete-24-regular";

    let lists = liveQuery(() => db.lists.toArray());

    async function trashList(id: number) {
        await db.lists.update(id, { is_deleted: true });
    }
</script>

<ul
    class="menu menu-horizontal w-full bg-base-300 border-b border-base-content/10 p-4"
>
    <li>
        <button
            class="btn btn-lg rounded-2xl bg-primary text-white hover:bg-linear-to-b hover:from-white/20 hover:shadow-lg"
            ><IconNew />New List</button
        >
    </li>
    <li>
        <button
            aria-label="Move to folder"
            class="btn btn-lg btn-square btn-ghost tooltip tooltip-bottom w-10 h-10"
            data-tip="Move to folder"><IconFolderMove /></button
        >
    </li>
    <button
        aria-label="Send to trash"
        class="btn btn-lg btn-square btn-ghost tooltip tooltip-bottom w-10 h-10"
        data-tip="Send to trash"
    >
        <IconTrash /></button
    >
</ul>

<section>
    <div class="w-full">
        {#if $lists}
            <ul class="list w-full border-b border-base-content/10">
                {#each $lists as list (list.id)}
                    {#if !list.is_deleted}
                        <li class="list-row bg-base-100 rounded-none">
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
</section>

<style lang="postcss">
    @import "tailwindcss";
    @plugin "daisyui";

    .list-row:hover {
        @apply shadow bg-base-100 bg-linear-to-b from-base-100 to-base-300;
    }

    .list-row:hover .list-actions {
        @apply opacity-100;
    }

    .list-actions {
        @apply opacity-0 justify-end;
    }

    li:has(input[type="checkbox"]:checked) {
        @apply bg-base-300;
    }
</style>
