import { db } from '../schema';
import { createEntity, updateEntity, softDeleteEntity, restoreEntity, purgeEntity } from './_base';
import type { MediaAsset, ImageField, AudioField, MediaField, Item, List } from '../types';

/** Swaps in a user-chosen display name but keeps the original file's extension, since
 *  that's what drives the file-type badge in the media library. */
function withOriginalExtension(name: string, originalFileName: string): string {
	const dotIndex = originalFileName.lastIndexOf('.');
	const ext = dotIndex > 0 ? originalFileName.slice(dotIndex) : '';
	return name.endsWith(ext) ? name : `${name}${ext}`;
}

export async function uploadImageAsset(file: File, name?: string): Promise<MediaAsset> {
	return createEntity(db.mediaAssets, {
		kind: 'image',
		sourceType: 'blob',
		blob: file,
		mimeType: file.type,
		fileName: name ? withOriginalExtension(name.trim(), file.name) : file.name,
		size: file.size
	});
}

export async function uploadAudioAsset(file: File, name?: string): Promise<MediaAsset> {
	return createEntity(db.mediaAssets, {
		kind: 'audio',
		sourceType: 'blob',
		blob: file,
		mimeType: file.type,
		fileName: name ? withOriginalExtension(name.trim(), file.name) : file.name,
		size: file.size
	});
}

/**
 * Downloads a URL and stores it as a blob-backed asset — the app is offline-first, so
 * "add by URL" must import the content rather than hot-link it (a bare `sourceType:'url'`
 * asset would depend on the remote site staying up and being reachable, defeating offline
 * use). Throws if the fetch fails (network error, 4xx/5xx, or the host blocks cross-origin
 * requests) — callers should catch this and surface it to the user.
 */
export async function importUrlAsset(
	guessedKind: 'image' | 'audio',
	url: string,
	name?: string
): Promise<MediaAsset> {
	const response = await fetch(url);
	if (!response.ok) throw new Error(`Fetch failed (${response.status})`);
	const blob = await response.blob();
	const kind = blob.type.startsWith('audio/')
		? 'audio'
		: blob.type.startsWith('image/')
			? 'image'
			: guessedKind;
	const urlFileName =
		decodeURIComponent(new URL(url).pathname.split('/').filter(Boolean).pop() ?? '') || undefined;
	const fileName = name
		? urlFileName
			? withOriginalExtension(name.trim(), urlFileName)
			: name.trim()
		: urlFileName;
	return createEntity(db.mediaAssets, {
		kind,
		sourceType: 'blob',
		blob,
		mimeType: blob.type || undefined,
		fileName,
		size: blob.size
	});
}

export async function getAsset(id: string): Promise<MediaAsset | undefined> {
	return db.mediaAssets.get(id);
}

export async function updateAsset(
	id: string,
	patch: Partial<Omit<MediaAsset, 'id' | 'createdAt'>>
): Promise<void> {
	return updateEntity(db.mediaAssets, id, patch);
}

/** Newest first — assets have no user-orderable `order` field. */
export async function listActiveAssets(kind?: 'image' | 'audio'): Promise<MediaAsset[]> {
	const assets = await db.mediaAssets
		.where('deletedAt')
		.equals(0)
		.and((a) => !kind || a.kind === kind)
		.toArray();
	return assets.sort((a, b) => b.createdAt - a.createdAt);
}

export async function listTrashedAssets(): Promise<MediaAsset[]> {
	return db.mediaAssets.where('deletedAt').above(0).toArray();
}

/** Scans active items for any field referencing this asset — powers "used by" indicators and delete warnings. */
export async function getAssetUsage(assetId: string): Promise<{ item: Item; list: List }[]> {
	const items = await db.items
		.where('deletedAt')
		.equals(0)
		.and((item) =>
			item.fields.some(
				(f) =>
					(f.type === 'image' || f.type === 'audio' || f.type === 'media') &&
					f.value.source === 'asset' &&
					f.value.assetId === assetId
			)
		)
		.toArray();
	const results: { item: Item; list: List }[] = [];
	for (const item of items) {
		const list = await db.lists.get(item.listId);
		if (list) results.push({ item, list });
	}
	return results;
}

export async function softDeleteAsset(id: string): Promise<void> {
	return softDeleteEntity(db.mediaAssets, id);
}

export async function restoreAsset(id: string): Promise<void> {
	return restoreEntity(db.mediaAssets, id);
}

export async function purgeAsset(id: string): Promise<void> {
	return purgeEntity(db.mediaAssets, id);
}

function urlForAsset(asset: MediaAsset): string | undefined {
	if (asset.sourceType === 'url') return asset.url;
	if (asset.blob) return URL.createObjectURL(asset.blob);
	return undefined;
}

/**
 * Resolves an image/audio field to a displayable URL — either the raw URL, or an
 * object URL for an uploaded blob. Callers must revoke object URLs they receive
 * (e.g. in a component's $effect cleanup) to avoid leaking memory.
 *
 * Treats a trashed asset the same as a missing one (returns undefined) — otherwise an
 * item whose image/audio was just deleted would keep rendering it as if nothing
 * happened, right up until the trash is purged and it breaks with no explanation.
 */
export async function resolveFieldMedia(
	field: ImageField | AudioField
): Promise<string | undefined> {
	if (field.value.source === 'url') return field.value.url;
	const asset = await db.mediaAssets.get(field.value.assetId);
	return asset && asset.deletedAt === 0 ? urlForAsset(asset) : undefined;
}

/**
 * Resolves a unified 'media' field to both a displayable URL and its kind (image/audio) —
 * unlike legacy image/audio fields, 'media' fields always point at a real MediaAsset (never
 * a bare URL), since kind has to come from somewhere. Callers must revoke blob object URLs.
 */
export async function resolveMediaField(
	field: MediaField
): Promise<{ url: string; kind: 'image' | 'audio' } | undefined> {
	if (field.value.source !== 'asset') return undefined;
	const asset = await db.mediaAssets.get(field.value.assetId);
	if (!asset || asset.deletedAt !== 0) return undefined;
	const url = urlForAsset(asset);
	return url ? { url, kind: asset.kind } : undefined;
}
