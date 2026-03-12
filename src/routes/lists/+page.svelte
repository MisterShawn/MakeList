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
    class="menu menu-horizontal w-full bg-base-200 border-b-2 border-base-300 p-4"
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
            <ul class="grid border-b border-base-300">
                {#each $lists as list (list.id)}
                    {#if !list.is_deleted}
                        <li
                            class="flex items-center p-4 gap-4 bg-base-100 rounded-none cursor-pointer border-b border-base-300 last:shadow-md"
                        >
                            <input
                                type="checkbox"
                                class="checkbox rounded-md"
                            />
                            <div class="flex-1 text-lg">
                                {list.name}
                            </div>
                            <div class="list-actions">
                                <button
                                    aria-label="Move to folder"
                                    class="btn btn-lg btn-square btn-ghost tooltip"
                                    data-tip="Move to folder"
                                    ><IconFolderMove /></button
                                >
                                <button
                                    aria-label="Send to trash"
                                    class="btn btn-lg btn-square btn-ghost tooltip"
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

    li:hover {
        @apply bg-base-100 bg-linear-to-b from-base-100 to-base-200;
    }

    li:hover .list-actions {
        @apply opacity-100;
    }

    .list-actions {
        @apply opacity-0 justify-end;
    }

    li:has(input[type="checkbox"]:checked) {
        @apply bg-linear-to-b from-base-200 to-base-100 inset-shadow-sm inset-shadow-base-100;
    }
</style>
