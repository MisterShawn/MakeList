import type { HTMLInputAttributes } from 'svelte/elements';

export type TagColorLookup = (tag: string) => { bg?: string; text?: string } | undefined;

export type TagsInputPropsWithoutHTML = {
	value?: string[];
	validate?: (val: string, tags: string[]) => string | undefined;
	onValueChange?: (value: string[]) => void;
	suggestions?: string[];
	filterSuggestions?: (inputValue: string, suggestions: string[]) => string[];
	restrictToSuggestions?: boolean;
	/** Optional per-tag color lookup — colors the added chips and the suggestion list to
	 *  match colors assigned elsewhere (e.g. the Tags page), without this generic input
	 *  needing to know where those colors actually come from. */
	getTagColor?: TagColorLookup;
};

export type TagsInputProps = TagsInputPropsWithoutHTML & Omit<HTMLInputAttributes, 'value'>;
