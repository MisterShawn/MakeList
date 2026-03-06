<script>
    import { liveQuery } from "dexie";
    import { db } from "$lib/db";

    import IconEdit from "~icons/fluent/text-bullet-list-square-edit-24-filled";
    import IconDelete from "~icons/fluent/delete-24-filled";

    let lists = liveQuery(() => db.lists.toArray());
</script>

<section class="">
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
