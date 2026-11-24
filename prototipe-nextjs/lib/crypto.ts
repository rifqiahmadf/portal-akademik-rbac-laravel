import {
	createHash,
	randomBytes,
	scryptSync,
	timingSafeEqual,
} from "node:crypto";

export function hashPassword(password: string) {
	const salt = randomBytes(16).toString("hex");
	return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

export function matchesPassword(password: string, stored?: string) {
	const [salt, hash] = stored?.split(":") ?? [
		"unregistered-demo-account",
		"00".repeat(64),
	];
	return timingSafeEqual(
		scryptSync(password, salt, 64),
		Buffer.from(hash, "hex"),
	);
}

export function tokenHash(token: string) {
	return createHash("sha256").update(token).digest("hex");
}
