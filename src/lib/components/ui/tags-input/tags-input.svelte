<script lang="ts">
	import { cn } from '$lib/utils.js';
	import type { TagsInputProps } from './types';
	import TagsInputTag from './tags-input-tag.svelte';
	import TagsInputSuggestion from './tags-input-suggestion.svelte';
	import { untrack } from 'svelte';
	import { Portal } from 'bits-ui';

	const defaultValidate: TagsInputProps['validate'] = (val, tags) => {
		const transformed = val.trim();

		// disallow empties
		if (transformed.length === 0) return undefined;

		// disallow duplicates
		if (tags.find((t) => transformed === t)) return undefined;

		return transformed;
	};

	const defaultFilter: NonNullable<TagsInputProps['filterSuggestions']> = (
		inputValue,
		suggestions
	) => {
		const lower = inputValue.toLowerCase();
		return suggestions.filter((s) => s.toLowerCase().includes(lower));
	};

	let {
		value = $bindable([]),
		placeholder,
		class: className,
		disabled = false,
		validate = defaultValidate,
		onValueChange,
		suggestions,
		filterSuggestions = defaultFilter,
		restrictToSuggestions = false,
		getTagColor,
		...rest
	}: TagsInputProps = $props();

	let inputValue = $state('');
	let tagIndex = $state<number>();
	let invalid = $state(false);
	let isComposing = $state(false);
	let inputFocused = $state(false);
	let suggestionIndex = $state<number>();
	let listboxId = $props.id();
	let listboxEl = $state<HTMLElement>();
	let rootEl = $state<HTMLDivElement>();

	$effect(() => {
		if (suggestionIndex !== undefined && listboxEl) {
			const item = listboxEl.querySelector(`#${CSS.escape(listboxId)}-${suggestionIndex}`);
			item?.scrollIntoView({ block: 'nearest' });
		}
	});

	// The suggestions listbox is portaled to <body> (see the Portal below) so it isn't
	// clipped by an ancestor with `overflow-hidden` — Card.Root always sets that, so any
	// TagsInput nested in a card would otherwise have its dropdown cut off. Portaling
	// means it's no longer positioned via the local `absolute` parent, so its screen
	// position is tracked here instead and kept in sync while open.
	let suggestionsPos = $state({ top: 0, left: 0, width: 0 });

	function updateSuggestionsPos() {
		if (!rootEl) return;
		const rect = rootEl.getBoundingClientRect();
		suggestionsPos = { top: rect.bottom, left: rect.left, width: rect.width };
	}

	$effect(() => {
		if (!showSuggestions) return;
		updateSuggestionsPos();
		window.addEventListener('scroll', updateSuggestionsPos, true);
		window.addEventListener('resize', updateSuggestionsPos);
		return () => {
			window.removeEventListener('scroll', updateSuggestionsPos, true);
			window.removeEventListener('resize', updateSuggestionsPos);
		};
	});

	const filteredSuggestions = $derived.by(() => {
		if (!suggestions) return [];

		const available = suggestions.filter((s) => !value.includes(s));

		if (inputValue.length === 0) return available;

		return filterSuggestions(inputValue, available);
	});

	const showSuggestions = $derived(
		inputFocused && filteredSuggestions.length > 0 && tagIndex === undefined
	);

	$effect(() => {
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		filteredSuggestions;

		untrack(() => {
			// default to first suggestion for better ux
			suggestionIndex = filteredSuggestions.length > 0 ? 0 : undefined;
		});
	});

	$effect(() => {
		// whenever input value changes reset invalid
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		inputValue;

		untrack(() => {
			invalid = false;
		});
	});

	const selectSuggestion = (val: string) => {
		const validated = validate(val, value);

		if (!validated) return;

		value = [...value, validated];
		onValueChange?.(value);
		inputValue = '';
		suggestionIndex = undefined;
	};

	const enter = () => {
		if (isComposing) return;

		if (showSuggestions && suggestionIndex !== undefined) {
			selectSuggestion(filteredSuggestions[suggestionIndex]);
			return;
		}

		if (restrictToSuggestions && suggestions) {
			const match = suggestions.find((s) => s.toLowerCase() === inputValue.trim().toLowerCase());

			if (!match) {
				invalid = true;
				return;
			}

			selectSuggestion(match);
			return;
		}

		const validated = validate(inputValue, value);

		if (!validated) {
			invalid = true;
			return;
		}

		value = [...value, validated];
		onValueChange?.(value);
		inputValue = '';
	};

	const compositionStart = () => {
		isComposing = true;
	};

	const compositionEnd = () => {
		isComposing = false;
	};

	const keydown = (e: KeyboardEvent) => {
		const target = e.target as HTMLInputElement;

		if (e.key === 'Escape') {
			if (showSuggestions) {
				suggestionIndex = undefined;
				inputFocused = false;
				target.blur();
				return;
			}
		}

		if (showSuggestions) {
			if (e.key === 'ArrowDown') {
				e.preventDefault();

				if (suggestionIndex === undefined) {
					suggestionIndex = 0;
				} else {
					suggestionIndex = (suggestionIndex + 1) % filteredSuggestions.length;
				}

				return;
			}

			if (e.key === 'ArrowUp') {
				e.preventDefault();

				if (suggestionIndex === undefined) {
					suggestionIndex = filteredSuggestions.length - 1;
				} else {
					suggestionIndex =
						(suggestionIndex - 1 + filteredSuggestions.length) % filteredSuggestions.length;
				}

				return;
			}
		}

		if (e.key === 'Enter') {
			// prevent form submit
			e.preventDefault();

			if (isComposing) return;

			// delete focused tag
			if (tagIndex !== undefined) {
				deleteIndex(tagIndex);

				// focus previous tag or reset
				const prev = tagIndex - 1;
				tagIndex = prev < 0 ? undefined : prev;
				return;
			}

			enter();
			return;
		}

		const isAtBeginning = target.selectionStart === 0 && target.selectionEnd === 0;

		let shouldResetIndex = true;

		if (e.key === 'Backspace') {
			if (isAtBeginning) {
				e.preventDefault();

				if (tagIndex !== undefined) {
					deleteIndex(tagIndex);

					// focus previous
					const prev = tagIndex - 1;

					if (prev < 0) {
						tagIndex = undefined;
					} else {
						tagIndex = prev;
					}
				} else {
					tagIndex = value.length - 1;
				}

				shouldResetIndex = false;
			}
		}

		if (e.key === 'Delete') {
			if (isAtBeginning) {
				if (inputValue.length === 0) {
					if (tagIndex !== undefined) {
						e.preventDefault();

						deleteIndex(tagIndex);

						// stay focused on the same index unless value.length === 0
						if (value.length === 0) tagIndex = undefined;

						shouldResetIndex = false;
					}
				}
			}
		}

		// controls for tag selection
		if (isAtBeginning) {
			// left
			if (e.key === 'ArrowLeft') {
				if (tagIndex !== undefined) {
					const prev = tagIndex - 1;

					if (prev < 0) {
						tagIndex = 0;
					} else {
						tagIndex = prev;
					}
				} else {
					// set initial index
					tagIndex = value.length - 1;
				}

				shouldResetIndex = false;
			}

			// right
			// we can only move right if the value is empty
			if (inputValue.length === 0) {
				if (e.key === 'ArrowRight') {
					if (tagIndex !== undefined) {
						const next = tagIndex + 1;

						if (next > value.length - 1) {
							tagIndex = undefined;
						} else {
							tagIndex = next;
						}

						shouldResetIndex = false;
					}
				}
			}
		}

		// reset the tag index to undefined
		if (shouldResetIndex) {
			tagIndex = undefined;
		}
	};

	const deleteValue = (val: string) => {
		const index = value.findIndex((v) => val === v);

		if (index === -1) return;

		deleteIndex(index);
	};

	const deleteIndex = (index: number) => {
		value = [...value.slice(0, index), ...value.slice(index + 1)];
		onValueChange?.(value);
	};

	const blur = () => {
		tagIndex = undefined;
		setTimeout(() => {
			inputFocused = false;
		}, 150);
	};

	const focus = () => {
		inputFocused = true;
	};
</script>

<div
	bind:this={rootEl}
	class={cn(
		'relative flex min-h-9 w-full flex-wrap place-items-center gap-1 rounded-md border border-input bg-background py-0.5 pr-1 pl-1 selection:bg-primary disabled:opacity-50 aria-disabled:cursor-not-allowed dark:bg-input/30',
		className
	)}
	aria-disabled={disabled}
>
	{#each value as tag, i (tag)}
		<TagsInputTag
			value={tag}
			{disabled}
			onDelete={deleteValue}
			active={i === tagIndex}
			color={getTagColor?.(tag)}
		/>
	{/each}
	<input
		{...rest}
		bind:value={inputValue}
		onblur={blur}
		onfocus={focus}
		oncompositionstart={compositionStart}
		oncompositionend={compositionEnd}
		{disabled}
		{placeholder}
		data-invalid={invalid}
		onkeydown={keydown}
		role={suggestions ? 'combobox' : undefined}
		aria-expanded={suggestions ? showSuggestions : undefined}
		aria-autocomplete={suggestions ? 'list' : undefined}
		aria-controls={suggestions ? listboxId : undefined}
		aria-activedescendant={suggestionIndex !== undefined
			? `${listboxId}-${suggestionIndex}`
			: undefined}
		class="min-w-16 shrink grow basis-0 border-none bg-transparent px-2 outline-hidden placeholder:text-muted-foreground focus:outline-hidden disabled:cursor-not-allowed data-[invalid=true]:text-red-500 md:text-sm"
	/>
	{#if showSuggestions}
		<Portal>
			<div
				bind:this={listboxEl}
				id={listboxId}
				role="listbox"
				style="position: fixed; top: {suggestionsPos.top}px; left: {suggestionsPos.left}px; width: {suggestionsPos.width}px;"
				class="z-50 mt-1 max-h-50 overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
			>
				{#each filteredSuggestions as suggestion, i (suggestion)}
					<TagsInputSuggestion
						id="{listboxId}-{i}"
						value={suggestion}
						active={i === suggestionIndex}
						onSelect={selectSuggestion}
						color={getTagColor?.(suggestion)}
					/>
				{/each}
			</div>
		</Portal>
	{/if}
</div>
