<script lang="ts">
    import { db } from "$lib/db";
    import ViewTags from "$lib/components/ViewTags.svelte";
    import Card from "$lib/components/Card.svelte";

    import IconAdd from "~icons/fluent/add-24-filled";
    import IconDelete from "~icons/fluent/delete-24-filled";
    import IconAttach from "~icons/fluent/attach-24-filled";
    import IconText from "~icons/fluent/textbox-24-filled";
    import IconImage from "~icons/fluent/image-24-filled";
    import IconEmoji from "~icons/fluent/emoji-laugh-24-filled";

    const now = new Date();

    let status = "";

    let name = "";
    let description = "";
    let folder = "";
    let boards = "";
    let created_at = 0;
    let updated_at = 0;
    let is_deleted = false;

    async function addList() {
        if (name) {
            try {
                const id = await db.lists.add({
                    name: name,
                    description: description,
                    folder: folder,
                    boards: boards,
                    created_at: created_at,
                    updated_at: updated_at,
                    is_deleted: is_deleted,
                });

                status = "List ${name} successfully added. Got id ${id}";

                // Reset form:
                name = "";
                description = "";
                folder = "";
                boards = "";
                created_at = 0;
                updated_at = 0;
            } catch (error) {
                status = `Failed to add ${name}: ${error}`;
            }
        }
    }
</script>

<Card type="form">
    {#snippet heading()}
        {#if name.length}{name}
        {:else}
            New List
        {/if}
    {/snippet}
    <form onsubmit={addList} class="grid gap-4">
        <div class="grid gap-2">
            <label for="list_name" class="floating-label">
                <span aria-label="List Name">List Name</span>
                <input
                    id="list_name"
                    type="text"
                    bind:value={name}
                    placeholder="List Name"
                    class="input w-full font-hand"
                    minlength="1"
                    maxlength="32"
                    required
                />
            </label>
        </div>

        <!-- <div class="grid gap-2">
                <label for="list-items" class="label">Items</label>
                <div class="join">
                    <input
                        id="list-items"
                        type="text"
                        bind:value={items}
                        placeholder="Add an item"
                        class="input w-full font-hand join-item"
                    />
                    <div class="dropdown">
                        <div
                            tabindex="0"
                            role="button"
                            class="btn btn-square text-blue-800 bg-blue-100 border-base-content/20 border-l-0"
                        >
                            <IconAttach />
                        </div>
                        <ul
                            tabindex="-1"
                            class="dropdown-content menu gap-2 bg-blue-100 border border-base-content/20 shadow-md rounded-lg rounded-tl-none"
                        >
                            <li>
                                <button
                                    class="btn px-8 text-base-100 bg-blue-500 rounded-lg"
                                    ><IconText />Text</button
                                >
                            </li>
                            <li>
                                <button
                                    class="btn px-8 text-base-100 bg-green-500 rounded-lg"
                                    ><IconImage />Image</button
                                >
                            </li>
                            <li>
                                <button
                                    class="btn px-8 text-base-100 bg-pink-500 rounded-lg"
                                    ><IconEmoji />Emoji</button
                                >
                            </li>
                        </ul>
                    </div>
                    <button
                        class="btn btn-square text-green-800 bg-green-100 border-base-content/20 join-item"
                        ><IconAdd /></button
                    >
                </div>
                <div class="join hidden">
                    <span
                        class="flex items-center px-2 bg-base-200 border border-base-content/20 join-item"
                    >
                        <input type="checkbox" class="checkbox" />
                    </span>
                    <input
                        type="text"
                        class="input w-full font-hand join-item"
                    />
                    <button
                        class="btn btn-square text-white bg-red-500 join-item"
                        ><IconDelete /></button
                    >
                </div>
            </div> -->
        <div class="collapse collapse-arrow bg-base-100 border-base-300 border">
            <input type="checkbox" />
            <div class="collapse-title">Extras</div>
            <div class="collapse-content grid gap-4">
                <div>
                    <label for="list-tags" class="label">Tags</label>
                    <ViewTags />
                </div>
                <div>
                    <label for="list-description" class="label">
                        Description
                    </label>
                    <textarea
                        name="list-description"
                        id="list-description"
                        placeholder="Optional description of your list."
                        class="textarea w-full"
                    ></textarea>
                </div>
            </div>
        </div>
        <button
            aria-label="Add List"
            class="btn btn-lg text-white btn-secondary rounded-2xl"
            type="submit"
        >
            Add List</button
        >
    </form>
</Card>
