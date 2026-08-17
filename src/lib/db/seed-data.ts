export interface SeedItemFieldSpec {
	type: 'text' | 'icon' | 'emoji';
	value: string;
	label?: string;
}

export interface SeedItemSpec {
	title: string;
	fields?: SeedItemFieldSpec[];
}

export interface SeedListSpec {
	seedKey: string;
	name: string;
	description?: string;
	listType: string;
	items: SeedItemSpec[];
}

const LETTERS = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
const NUMBERS = Array.from({ length: 100 }, (_, i) => i + 1);

const ANIMALS: { title: string; emoji: string }[] = [
	{ title: 'Dog', emoji: '🐶' },
	{ title: 'Cat', emoji: '🐱' },
	{ title: 'Cow', emoji: '🐮' },
	{ title: 'Pig', emoji: '🐷' },
	{ title: 'Horse', emoji: '🐴' },
	{ title: 'Sheep', emoji: '🐑' },
	{ title: 'Chicken', emoji: '🐔' },
	{ title: 'Duck', emoji: '🦆' },
	{ title: 'Rabbit', emoji: '🐰' },
	{ title: 'Fox', emoji: '🦊' },
	{ title: 'Bear', emoji: '🐻' },
	{ title: 'Panda', emoji: '🐼' },
	{ title: 'Lion', emoji: '🦁' },
	{ title: 'Tiger', emoji: '🐯' },
	{ title: 'Elephant', emoji: '🐘' },
	{ title: 'Monkey', emoji: '🐵' },
	{ title: 'Frog', emoji: '🐸' },
	{ title: 'Fish', emoji: '🐟' },
	{ title: 'Bird', emoji: '🐦' },
	{ title: 'Owl', emoji: '🦉' }
];

const COLORS: { title: string; hex: string }[] = [
	{ title: 'Red', hex: '#ef4444' },
	{ title: 'Orange', hex: '#f97316' },
	{ title: 'Yellow', hex: '#eab308' },
	{ title: 'Green', hex: '#22c55e' },
	{ title: 'Blue', hex: '#3b82f6' },
	{ title: 'Purple', hex: '#a855f7' },
	{ title: 'Pink', hex: '#ec4899' },
	{ title: 'Brown', hex: '#92400e' },
	{ title: 'Black', hex: '#171717' },
	{ title: 'White', hex: '#f9fafb' },
	{ title: 'Gray', hex: '#6b7280' },
	{ title: 'Teal', hex: '#14b8a6' }
];

export const SEED_LISTS: SeedListSpec[] = [
	{
		seedKey: 'letters',
		name: 'Letters A–Z',
		description: 'The 26 letters of the alphabet.',
		listType: 'generic',
		items: LETTERS.map((letter) => ({
			title: letter,
			fields: [{ type: 'text', value: letter }]
		}))
	},
	{
		seedKey: 'numbers',
		name: 'Numbers 1–100',
		description: 'Counting from 1 to 100.',
		listType: 'generic',
		items: NUMBERS.map((n) => ({
			title: String(n),
			fields: [{ type: 'text', value: String(n) }]
		}))
	},
	{
		seedKey: 'animals',
		name: 'Common Animals',
		description: 'Everyday animals, with their emoji.',
		listType: 'generic',
		items: ANIMALS.map((a) => ({
			title: a.title,
			fields: [{ type: 'emoji', value: a.emoji }]
		}))
	},
	{
		seedKey: 'colors',
		name: 'Common Colors',
		description: 'Everyday colors, with their hex code.',
		listType: 'generic',
		items: COLORS.map((c) => ({
			title: c.title,
			fields: [{ type: 'text', value: c.hex, label: 'Hex code' }]
		}))
	}
];
