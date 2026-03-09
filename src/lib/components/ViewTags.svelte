<script lang="ts">
    import { liveQuery } from "dexie";
    import { db } from "$lib/db";

    let tags = liveQuery(() => db.tags.toArray());
</script>

<ul>
    {#if $tags}
        {#each $tags as tag (tag.id)}
            <li>{tag.name}</li>
        {/each}
    {:else}
        <li>
            No tags yet. <button class="badge badge-primary">Add one!</button>
        </li>
    {/if}
</ul>
