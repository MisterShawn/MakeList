export type Theme = 'light' | 'dark' | 'system';

export function getStoredTheme(): Theme {
	if (typeof localStorage === 'undefined') return 'system';
	return (localStorage.getItem('theme') as Theme) ?? 'system';
}

export function setTheme(theme: Theme) {
	localStorage.setItem('theme', theme);
	applyTheme(theme);
}

export function applyTheme(theme: Theme) {
	const isDark =
		theme === 'dark' ||
		(theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
	document.documentElement.classList.toggle('dark', isDark);
}

export function initTheme() {
	applyTheme(getStoredTheme());
}
