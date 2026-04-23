<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { useSidebar } from '$lib/components/ui/sidebar/context.svelte.js';

	const sidebar = useSidebar();

	afterNavigate(() => {
		if (sidebar.isMobile) {
			sidebar.setOpenMobile(false);
		}
	});
</script>
