<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';

	let { count }: { count: number } = $props();
</script>

<Badge variant="secondary">{count} item{count === 1 ? '' : 's'}</Badge>
