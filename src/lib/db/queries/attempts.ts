import { db } from '../schema';
import { createEntity } from './_base';
import type { AttemptResult, BaseEntity } from '../types';

export async function recordAttempt(
	data: Omit<AttemptResult, keyof BaseEntity>
): Promise<AttemptResult> {
	return createEntity(db.attemptResults, data);
}

function byCompletedAtDesc(a: AttemptResult, b: AttemptResult): number {
	return (b.completedAt ?? b.startedAt) - (a.completedAt ?? a.startedAt);
}

export async function listAttemptsForUser(userId: string): Promise<AttemptResult[]> {
	const rows = await db.attemptResults
		.where('userId')
		.equals(userId)
		.and((a) => a.deletedAt === 0)
		.toArray();
	return rows.sort(byCompletedAtDesc);
}

export async function listAttemptsForActivity(activityId: string): Promise<AttemptResult[]> {
	const rows = await db.attemptResults
		.where('activityId')
		.equals(activityId)
		.and((a) => a.deletedAt === 0)
		.toArray();
	return rows.sort(byCompletedAtDesc);
}

export async function getAttemptHistory(
	userId: string,
	activityId: string
): Promise<AttemptResult[]> {
	const rows = await db.attemptResults
		.where('[activityId+userId]')
		.equals([activityId, userId])
		.and((a) => a.deletedAt === 0)
		.toArray();
	return rows.sort(byCompletedAtDesc);
}
