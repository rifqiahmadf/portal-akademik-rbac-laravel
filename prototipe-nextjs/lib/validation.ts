import { type Action, can, type Resource } from "./policy";
import type { User } from "./session";

export class RequestError extends Error {
	readonly status: number;

	constructor(status: number, message: string) {
		super(message);
		this.status = status;
	}
}

export function fail(status: number, message: string): never {
	throw new RequestError(status, message);
}

export function authorize(
	user: User | null,
	resource: Resource,
	action: Action,
): asserts user is User {
	if (!user) fail(401, "Silakan masuk untuk melanjutkan.");
	if (!can(user.role, resource, action))
		fail(403, "Peran Anda tidak memiliki izin untuk tindakan ini.");
}

export function recordId(key?: string) {
	const id = Number(key);
	if (
		!key ||
		!/^[1-9][0-9]*$/.test(key) ||
		!Number.isSafeInteger(id) ||
		id > 2_147_483_647
	)
		fail(400, "ID tidak valid.");
	return id;
}

export function fields<K extends string>(
	payload: unknown,
	names: readonly K[],
): Record<K, unknown> {
	if (
		!payload ||
		typeof payload !== "object" ||
		Array.isArray(payload) ||
		Object.keys(payload).length !== names.length ||
		!names.every((name) => Object.hasOwn(payload, name))
	) {
		fail(400, "Isian permintaan tidak valid.");
	}
	return payload as Record<K, unknown>;
}

export function textField(
	value: unknown,
	label: string,
	min: number,
	max: number,
) {
	const normalized = typeof value === "string" ? value.trim() : "";
	if (normalized.length < min || normalized.length > max)
		fail(400, `${label} harus berisi ${min}–${max} karakter.`);
	return normalized;
}

export function integer(
	value: unknown,
	label: string,
	min: number,
	max: number,
) {
	if (
		typeof value !== "number" ||
		!Number.isInteger(value) ||
		value < min ||
		value > max
	) {
		fail(400, `${label} harus berupa bilangan bulat ${min}–${max}.`);
	}
	return value;
}

export function choice<T extends string>(
	value: unknown,
	label: string,
	choices: readonly T[],
) {
	const match = choices.find((option) => option === value);
	if (!match) fail(400, `${label} tidak valid.`);
	return match;
}

export function toggle(value: unknown, label: string) {
	if (typeof value !== "boolean") fail(400, `${label} tidak valid.`);
	return value ? 1 : 0;
}

export function emailField(value: unknown) {
	const email = textField(value, "Email", 5, 100).toLowerCase();
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
		fail(400, "Email tidak valid.");
	return email;
}
