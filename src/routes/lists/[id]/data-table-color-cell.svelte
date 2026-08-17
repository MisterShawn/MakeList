<script lang="ts">
	import ColorPickerField from '$lib/components/ColorPickerField.svelte';

	let {
		bg,
		text,
		onSave
	}: {
		bg?: string;
		text?: string;
		onSave: (patch: { bgColor?: string; textColor?: string }) => void;
	} = $props();
</script>

<!-- eslint-disable-next-line svelte/no-static-element-interactions -->
<div onclick={(e) => e.stopPropagation()} role="presentation">
	<ColorPickerField {bg} {text} placeholder="—" {onSave} />
</div>
