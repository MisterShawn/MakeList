/**
 * Tailwind color palette used by ColorPicker — the 26 shaded color families this
 * Tailwind version ships (verified against node_modules/tailwindcss/theme.css — the
 * classic 22 plus mauve/olive/mist/taupe) x all 11 shade steps.
 *
 * `findSwatch` builds `bg-*`/`text-*` class names dynamically rather than spelling out
 * every combination literally. Tailwind's scanner normally needs the literal string to
 * appear in source, but the `@source inline(...)` directive in layout.css tells it to
 * generate every {bg,text}-{hue}-{shade} combination up front regardless — keep that
 * directive's hue/shade lists in sync with COLOR_HUES/COLOR_SHADES below, or newly added
 * colors will resolve to class names that don't actually have CSS behind them.
 */
export const COLOR_HUES = [
	'neutral',
	'slate',
	'mauve',
	'olive',
	'mist',
	'taupe',
	'red',
	'orange',
	'amber',
	'yellow',
	'lime',
	'green',
	'emerald',
	'teal',
	'cyan',
	'sky',
	'blue',
	'indigo',
	'violet',
	'purple',
	'fuchsia',
	'pink'
] as const;

export type ColorHue = (typeof COLOR_HUES)[number];

export const COLOR_SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

export type ColorShade = (typeof COLOR_SHADES)[number];

export interface ColorSwatch {
	token: string;
	bg: string;
	text: string;
}

export function findSwatch(hue: string, shade: number): ColorSwatch | undefined {
	if (!(COLOR_HUES as readonly string[]).includes(hue)) return undefined;
	if (!(COLOR_SHADES as readonly number[]).includes(shade)) return undefined;
	return {
		token: `${hue}-${shade}`,
		bg: `bg-${hue}-${shade}`,
		text: `text-${hue}-${shade}`
	};
}
