<script>
    import { db } from "$lib/db";
    import IconList from "~icons/fluent/text-bullet-list-square-24-filled";
    import IconAdd from "~icons/fluent/add-24-filled";
    import IconEdit from "~icons/fluent/text-bullet-list-square-edit-24-filled";
    import IconDelete from "~icons/fluent/delete-24-filled";
    import IconCancel from "~icons/fluent/arrow-circle-left-24-filled";

    const now = new Date();

    let status = "";

    let title = "";
    let description = "";
    let header = "";
    let items = "";
    let tags = "";
    let folder = "";
    let boards = "";
    let created_at = 0;
    let updated_at = 0;

    async function newList() {
        try {
            const id = await db.lists.add({
                title: title,
                description: description,
                header: header,
                items: items,
                tags: tags,
                folder: folder,
                boards: boards,
                created_at: created_at,
                updated_at: updated_at,
            });

            status = "List ${title} successfully added. Got id ${id}";

            // Reset form:
            title = "";
            description = "";
            header = "";
            items = "";
            tags = "";
            folder = "";
            boards = "";
            created_at = 0;
            updated_at = 0;
        } catch (error) {
            status = `Failed to add ${title}: ${error}`;
        }
    }
</script>

<section
    class="min-w-72 bg-base-100 rounded-2xl bg-linear-to-t from-primary/10 to-base-100 border border-base-content/20 shadow-md"
>
    <fieldset>
        <form onsubmit={newList} class="grid gap-4">
            <div class="p-4">
                <legend
                    class="fieldset-legend w-full flex justify-center text-2xl text-primary font-bold md:text-3xl"
                >
                    New List
                </legend>
                <div class="grid gap-2">
                    <label for="list_title" class="label"> Title </label>
                    <input
                        id="list_title"
                        type="text"
                        bind:value={title}
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
                            bind:value={items}
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
                        <button
                            class="btn btn-square text-white bg-red-500 join-item"
                            ><IconDelete /></button
                        >
                    </div>
                </div>
                <div
                    class="collapse collapse-arrow bg-base-100 border-base-300 border"
                >
                    <input type="checkbox" />
                    <div class="collapse-title font-semibold">More Options</div>
                    <div class="collapse-content text-sm">
                        <label for="list-description" class="label"
                            >Description</label
                        >
                        <textarea
                            name="list-description"
                            id="list-description"
                            placeholder="Description"
                            class="textarea"
                        >
                        </textarea>
                    </div>
                </div>
            </div>
            <button
                aria-label="Add List"
                class="btn btn-lg text-white btn-primary rounded-t-none rounded-b-2xl"
                type="submit"
                onclick={newList}>Add List</button
            >
        </form>
    </fieldset>
</section>
