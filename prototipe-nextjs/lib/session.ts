import { randomBytes } from "node:crypto";
import { matchesPassword, tokenHash } from "./crypto";
import { isRole, type Role } from "./policy";
import { type Database, prisma, write } from "./prisma";

export const sessionCookie = "akademik_session";
export const sessionSeconds = 8 * 60 * 60;

export type User = {
	id: number;
	username: string;
	name: string;
	email: string;
	role: Role;
};

export async function authenticate(
	username: string,
	password: string,
	previousToken?: string,
) {
	const users = prisma.sql.public.users;
	const [account] = await prisma.query(
		users
			.select("id", "password", "active")
			.where((f, q) => q.eq(f.username, username))
			.build(),
	);
	if (!matchesPassword(password, account?.password) || !account?.active)
		return null;
	const token = randomBytes(32).toString("base64url");
	const now = Date.now();
	return write(async (tx) => {
		const [current] = await tx.query(
			tx.sql.public.users
				.select("id", "active", "password")
				.where((f, q) => q.eq(f.id, account.id))
				.build(),
		);
		if (!current?.active || current.password !== account.password) return null;
		const sessions = tx.sql.public.sessions;
		await tx.execute(
			sessions
				.delete()
				.where((f, q) => q.lte(f.expires_at, BigInt(now)))
				.build(),
		);
		if (previousToken) {
			await tx.execute(
				sessions
					.delete()
					.where((f, q) => q.eq(f.token_hash, tokenHash(previousToken)))
					.build(),
			);
		}
		await tx.execute(
			sessions
				.insert([
					{
						token_hash: tokenHash(token),
						user_id: account.id,
						expires_at: BigInt(now + sessionSeconds * 1000),
					},
				])
				.build(),
		);
		return token;
	});
}

export async function getUser(
	token?: string,
	db: Database = prisma,
): Promise<User | null> {
	if (!token || !/^[\w-]{43}$/.test(token)) return null;
	const { sessions, users } = db.sql.public;
	const [record] = await db.query(
		sessions
			.innerJoin(users, (f, q) => q.eq(f.sessions.user_id, f.users.id))
			.select("id", "username", "name", "email", "role")
			.where((f, q) =>
				q.and(
					q.eq(f.token_hash, tokenHash(token)),
					q.gt(f.expires_at, BigInt(Date.now())),
					q.eq(f.active, 1),
				),
			)
			.build(),
	);
	if (!record || !isRole(record.role)) return null;
	return { ...record, role: record.role };
}

export async function revokeSession(token?: string) {
	if (!token) return;
	await write((tx) =>
		tx.execute(
			tx.sql.public.sessions
				.delete()
				.where((f, q) => q.eq(f.token_hash, tokenHash(token)))
				.build(),
		),
	);
}
