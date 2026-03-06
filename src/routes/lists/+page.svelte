<script lang="ts">
    import ViewLists from "$lib/components/ViewLists.svelte";
    import IconAdd from "~icons/fluent/add-24-filled";
</script>

<a
    href="lists/new"
    class="flex flex-col items-center gap-2 p-4 rounded-2xl text-2xl text-white bg-green-500"
>
    <span><IconAdd /></span>
    <span>New List</span>
</a>

<ViewLists />
