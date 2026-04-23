import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/** Returns 'white' or 'black' for readable text on an OKLCH background color. */
export function contrastColor(color: string): 'white' | 'black' {
	const m = color.match(/oklch\((\d+\.?\d*)%/);
	return m && Number(m[1]) < 65 ? 'white' : 'black';
}

/** Adds an optional `ref` binding to any HTML element props type. */
export type WithElementRef<T, E extends HTMLElement = HTMLElement> = T & {
	ref?: E | null;
};

/** Omits `children` and `child` snippet props (used by shadcn-svelte components). */
export type WithoutChildrenOrChild<T> = Omit<T, 'children' | 'child'>;

/** Omits `child` snippet prop (used by shadcn-svelte components). */
export type WithoutChild<T> = Omit<T, 'child'>;
