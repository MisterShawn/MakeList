# MakeList — Claude Instructions

## Stack

- SvelteKit 2 + Svelte 5 runes (TypeScript strict)
- Dexie.js 4 (IndexedDB), all access through `src/lib/db/queries.ts` only
- Tailwind CSS v4
- shadcn-svelte (bits-ui) — default/zinc style
- Lucide Svelte for icons
- OpenMoji 16 self-hosted at `/static/openmoji/`, rendered as `<img src="/openmoji/{HEXCODE}.svg">`
- adapter-static SPA (`prerender=true`, `ssr=false`), no backend, no auth

## UI components — always use shadcn-svelte

**Before building any UI component**, check `shadcn-svelte-llms.txt` in the project root.

**Always use shadcn-svelte components** (`Input`, `Button`, `Textarea`, `Label`, `Checkbox`, etc.) over raw HTML elements, even when custom styling is needed. Apply overrides via the `class` prop — do not drop down to bare `<input>`, `<button>`, `<textarea>`, etc.

This applies to sub-patterns too: tab bars, tag pills, grouped action buttons, popovers, tooltips — check shadcn first.

## Dialogs

Always use `src/lib/components/ResponsiveDialog.svelte` instead of `* as Dialog` directly. It renders a Drawer on mobile and a Dialog on desktop. Pass `title`, optional `description`, optional `class`. Use `{#snippet children()}` for the body and `{#snippet footer()}` for actions.

## Svelte 5 rules

- Use `$derived(expr)` not `$derived(() => expr)`
- Strip Svelte 5 proxies before Dexie writes: `JSON.parse(JSON.stringify(value))`
- Pre-read props before `$state()` to avoid `state_referenced_locally` warning
- All `<button>` elements need an explicit `type` attribute
- No self-closing non-void HTML elements

## Layout

- Use `shrink-0` on squeezed flex children, not a fixed height on the container

## Package manager

Use `npm`, not pnpm or bun.
