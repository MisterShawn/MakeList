<script lang="ts">
	import { onMount } from 'svelte';
	import { getTags, createTag, updateTag, softDeleteTag } from '$lib/db/queries';
	import type { Tag } from '$lib/db/schema';
	import ResponsiveDialog from '$lib/components/ResponsiveDialog.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Plus, Trash2, Tag as TagIcon, Pencil } from 'lucide-svelte';
	import { buttonVariants } from '$lib/components/ui/button';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { cn } from '$lib/utils';
	import { toast } from 'svelte-sonner';
	import ColorPicker from '$lib/components/ColorPicker.svelte';

	const DEFAULT_COLOR = 'oklch(54.6% 0.245 262.881)'; // Blue-600

	// ── State ──────────────────────────────────────────────────────────────────

	let tags = $state<Tag[]>([]);
	let loading = $state(true);
	let editing = $state(false);

	// Dialog
	let dialogOpen = $state(false);
	let editingTag = $state<Tag | null>(null);
	let formName = $state('');
	let formColor = $state(DEFAULT_COLOR);
	let saving = $state(false);

	// ── Derived ────────────────────────────────────────────────────────────────

	const dialogTitle = $derived(editingTag ? 'Edit tag' : 'New tag');
	const canSave = $derived(formName.trim().length > 0);

	// ── Data loading ───────────────────────────────────────────────────────────

	onMount(async () => {
		tags = await getTags();
		loading = false;
	});

	async function load() {
		tags = await getTags();
	}

	// ── Dialog helpers ─────────────────────────────────────────────────────────

	function openCreate() {
		editingTag = null;
		formName = '';
		formColor = DEFAULT_COLOR;
		dialogOpen = true;
	}

	function openEdit(tag: Tag, e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		editingTag = tag;
		formName = tag.name;
		formColor = tag.color;
		dialogOpen = true;
	}

	async function handleSave() {
		if (!canSave || saving) return;
		saving = true;
		try {
			if (editingTag) {
				await updateTag(editingTag.id!, { name: formName.trim(), color: formColor });
			} else {
				await createTag({ name: formName.trim(), color: formColor });
			}
			dialogOpen = false;
			await load();
		} finally {
			saving = false;
		}
	}

	function handleFormKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSave();
		}
	}

	// ── Delete ─────────────────────────────────────────────────────────────────

	function deleteTag(tag: Tag) {
		tags = tags.filter((t) => t.id !== tag.id);

		let tid: ReturnType<typeof setTimeout>;
		toast(`"${tag.name}" moved to trash`, {
			duration: 5000,
			action: {
				label: 'Undo',
				onClick: () => {
					clearTimeout(tid);
					tags = [...tags, tag].sort((a, b) => a.name.localeCompare(b.name));
				},
			},
		});
		tid = setTimeout(() => softDeleteTag(tag.id!), 5000);
	}

	function handleDelete() {
		if (!editingTag) return;
		dialogOpen = false;
		deleteTag(editingTag);
	}
</script>

<svelte:head><title>Tags — MakeList</title></svelte:head>

<div class="flex h-full flex-col">
	<PageHeader crumbs={[{ label: 'Tags' }]}>
		{#snippet actions()}
			<Button
				variant={editing ? 'secondary' : 'outline'}
				size="sm"
				onclick={() => (editing = !editing)}
			>
				<Pencil size={13} />
				{editing ? 'Done' : 'Edit'}
			</Button>
		{/snippet}
	</PageHeader>

	<!-- ── Content ───────────────────────────────────────────────────────────── -->
	<div class="flex-1 overflow-y-auto p-6">
		{#if loading}
			<p class="text-sm text-muted-foreground">Loading…</p>
		{:else if tags.length === 0 && !editing}
			<div class="flex flex-col items-center gap-3 pt-16 text-center">
				<TagIcon size={32} class="text-muted-foreground/40" />
				<p class="text-sm text-muted-foreground">No tags yet. Create your first one.</p>
				<Button onclick={openCreate}>
					<Plus size={15} />
					New tag
				</Button>
			</div>
		{:else}
			<div class="flex flex-wrap gap-3">
				<button
					type="button"
					onclick={openCreate}
					class={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-7 rounded-full text-xs')}
				>
					<Plus size={12} />
					New tag
				</button>
				{#each tags as tag (tag.id)}
					{#if editing}
						<button
							type="button"
							onclick={(e) => openEdit(tag, e)}
							class="inline-flex items-center gap-1.5 rounded-full py-1 pl-3 pr-2 text-sm font-medium text-white transition-opacity hover:opacity-80"
							style="background-color: {tag.color}"
						>
							{tag.name}
							<Pencil size={11} class="opacity-70" />
						</button>
					{:else}
						<a
							href="/tags/{tag.id}"
							class="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-white transition-opacity hover:opacity-80"
							style="background-color: {tag.color}"
						>
							{tag.name}
						</a>
					{/if}
				{/each}
			</div>
		{/if}
	</div>
</div>

<!-- ── Create / Edit dialog ──────────────────────────────────────────────── -->
<ResponsiveDialog bind:open={dialogOpen} title={dialogTitle} class="max-w-sm">
	{#snippet children()}
		<div class="flex flex-col gap-4 py-2">
			<!-- Preview -->
			<div class="flex items-center justify-center gap-2">
				<ColorPicker bind:value={formColor} />
				<span
					class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
					style="background-color: {formColor}"
				>
					{formName.trim() || 'Tag name'}
				</span>
			</div>

			<!-- Name -->
			<div class="flex flex-col gap-1.5">
				<Label for="tag-name">Name</Label>
				<Input
					id="tag-name"
					type="text"
					placeholder="e.g. Favorites"
					bind:value={formName}
					onkeydown={handleFormKeydown}
				/>
			</div>

		</div>
	{/snippet}
	{#snippet footer()}
		<Button variant="outline" onclick={() => (dialogOpen = false)}>Cancel</Button>
		<Button onclick={handleSave} disabled={!canSave || saving}>
			{saving ? 'Saving…' : 'Save'}
		</Button>
		{#if editingTag}
			<Button variant="destructive" onclick={handleDelete} class="sm:order-first sm:mr-auto">
				<Trash2 size={14} />
				Delete
			</Button>
		{/if}
	{/snippet}
</ResponsiveDialog>
