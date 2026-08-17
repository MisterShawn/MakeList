export function useMediaQuery(query: string) {
	let matches = $state(false);

	$effect(() => {
		const mql = window.matchMedia(query);
		matches = mql.matches;
		const onChange = (e: MediaQueryListEvent) => (matches = e.matches);
		mql.addEventListener('change', onChange);
		return () => mql.removeEventListener('change', onChange);
	});

	return {
		get matches() {
			return matches;
		}
	};
}
