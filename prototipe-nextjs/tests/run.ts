import assert from "node:assert/strict";
import { type ChildProcess, spawn } from "node:child_process";
import { once } from "node:events";
import { test } from "node:test";
import { setTimeout as wait } from "node:timers/promises";
import { postgresUrl } from "../lib/postgres-url.ts";

const base = "http://127.0.0.1:3101";
const password = "AkademikDemo!26";
const accountsByRole = {
	mahasiswa: "nara",
	dosen: "ratih",
	operator: "sinta",
	administrator: "arya",
} as const;
type Role = keyof typeof accountsByRole;
if (new URL(postgresUrl()).pathname !== "/akademik_uji") {
	throw new Error(
		"Pengujian membutuhkan database PostgreSQL terisolasi akademik_uji.",
	);
}
let server: ChildProcess | undefined;

async function stop() {
	if (!server || server.exitCode !== null || server.signalCode !== null) return;
	const stopped = once(server, "exit");
	server.kill();
	await stopped;
}

async function start() {
	const env = { ...process.env, HOSTNAME: "127.0.0.1", PORT: "3101" };
	server = spawn(process.execPath, ["server.js"], {
		env,
		stdio: ["ignore", "ignore", "inherit"],
	});
	for (let step = 0; step < 100; step++) {
		if (server.exitCode !== null) break;
		try {
			if (
				(
					await fetch(`${base}/api/health`, {
						signal: AbortSignal.timeout(1000),
					})
				).ok
			)
				return;
		} catch {}
		await wait(100);
	}
	throw new Error("Server pengujian gagal mulai.");
}

type RequestOptions = {
	cookie?: string;
	origin?: string;
	body?: unknown;
	contentType?: string;
};

// JSON shape is verified by the individual assertions against the running service.
async function request(
	method: string,
	path: string,
	options: RequestOptions = {},
) {
	const headers: Record<string, string> = { Origin: options.origin || base };
	if (options.cookie) headers.Cookie = options.cookie;
	if (options.body !== undefined) headers["Content-Type"] = "application/json";
	if (options.contentType) headers["Content-Type"] = options.contentType;
	const response = await fetch(`${base}/api/${path}`, {
		method,
		headers,
		body: options.body === undefined ? undefined : JSON.stringify(options.body),
		redirect: "manual",
		signal: AbortSignal.timeout(5000),
	});
	const value = await response.json();
	return { status: response.status, value, headers: response.headers };
}

async function expectStatus(
	method: string,
	path: string,
	status: number,
	options?: RequestOptions,
) {
	const response = await request(method, path, options);
	assert.equal(
		response.status,
		status,
		`${method} /api/${path} ${JSON.stringify(response.value)}`,
	);
	assert.equal(response.headers.get("cache-control"), "no-store");
	return response;
}

async function signIn(username: string, secret = password) {
	const response = await expectStatus("POST", "masuk", 200, {
		body: { username, password: secret },
	});
	const header = response.headers.get("set-cookie") ?? "";
	assert.match(header, /HttpOnly/i);
	assert.match(header, /SameSite=lax/i);
	return header.split(";")[0];
}

const get = (cookie: string, path: string) =>
	expectStatus("GET", path, 200, { cookie }).then((response) => response.value);

test("RBAC portal akademik melalui HTTP lokal", async (t) => {
	try {
		await start();
		const sessions = {
			mahasiswa: await signIn(accountsByRole.mahasiswa),
			dosen: await signIn(accountsByRole.dosen),
			operator: await signIn(accountsByRole.operator),
			administrator: await signIn(accountsByRole.administrator),
		};
		const {
			mahasiswa: nara,
			dosen: ratih,
			operator: sinta,
			administrator: arya,
		} = sessions;
		const bima = await signIn("bima");
		const yudha = await signIn("yudha");

		await t.test("01 Sesi wajib dan kredensial salah ditolak", async () => {
			await expectStatus("GET", "me", 401);
			await expectStatus("POST", "krs/12", 401, { body: {} });
			await expectStatus("POST", "masuk", 401, {
				body: { username: "nara", password: "keliru" },
			});
		});

		await t.test(
			"02 Seluruh matriks izin, 96 kombinasi peran × aktivitas × metode",
			async () => {
				const expected: Record<Role, Record<string, string>> = {
					mahasiswa: { me: "G", krs: "GPD" },
					dosen: { me: "G", nilai: "GPU" },
					operator: { me: "G", registrasi: "GU" },
					administrator: { me: "G", akun: "GPU", konfigurasi: "GU" },
				};
				const methods = { G: "GET", P: "POST", U: "PATCH", D: "DELETE" };
				for (const [role, cookie] of Object.entries(sessions)) {
					for (const resource of [
						"me",
						"krs",
						"nilai",
						"registrasi",
						"akun",
						"konfigurasi",
					]) {
						for (const [code, method] of Object.entries(methods)) {
							const allowed = expected[role as Role][resource]?.includes(code);
							const status = allowed ? (method === "GET" ? 200 : 415) : 403;
							await expectStatus(method, resource, status, { cookie });
						}
					}
				}
			},
		);

		await t.test(
			"03 Profil dan riwayat studi terbatas pada sesi pemilik",
			async () => {
				const naraProfile = await get(nara, "me/101");
				assert.equal(naraProfile.profile.username, "nara");
				assert.deepEqual(
					naraProfile.study.map(
						(course: { code: string; score: number | null }) => [
							course.code,
							course.score,
						],
					),
					[["IF201", 88]],
				);
				assert.deepEqual(
					(await get(bima, "me")).study.map(
						(course: { code: string }) => course.code,
					),
					["IF201", "IF204"],
				);
				await expectStatus("GET", "me/102", 403, { cookie: nara });
				await expectStatus("GET", "me/101", 403, { cookie: arya });
			},
		);

		await t.test(
			"04 Pengajuan dan penarikan KRS hanya milik mahasiswa yang masuk",
			async () => {
				assert.deepEqual(
					(await get(nara, "krs")).study.map(
						(course: { id: number }) => course.id,
					),
					[11],
				);
				await expectStatus("POST", "krs/12", 400, {
					cookie: nara,
					body: { studentId: 102 },
				});
				await expectStatus("DELETE", "krs/12", 404, { cookie: nara, body: {} });
				const attempts = await Promise.all(
					[1, 2].map(() =>
						request("POST", "krs/12", { cookie: nara, body: {} }),
					),
				);
				assert.deepEqual(
					attempts.map((result) => result.status).sort(),
					[201, 409],
				);
				assert.deepEqual(
					(await get(nara, "krs")).study.map(
						(course: { id: number }) => course.id,
					),
					[11, 12],
				);
				await expectStatus("DELETE", "krs/12", 200, { cookie: nara, body: {} });
				await expectStatus("DELETE", "krs/11", 409, { cookie: nara, body: {} });
				assert.deepEqual(
					(await get(bima, "krs")).study.map(
						(course: { id: number }) => course.id,
					),
					[11, 12],
				);
			},
		);

		await t.test(
			"05 Dosen menambah dan mengubah nilai kelas ampuan",
			async () => {
				assert.deepEqual(
					(await get(ratih, "nilai")).classes.map(
						(course: { id: number }) => course.id,
					),
					[11, 13],
				);
				assert.deepEqual(
					(await get(yudha, "nilai")).classes.map(
						(course: { id: number }) => course.id,
					),
					[12, 14],
				);
				await expectStatus("GET", "nilai/12", 403, { cookie: ratih });
				await expectStatus("POST", "nilai/3", 403, {
					cookie: ratih,
					body: { score: 77 },
				});
				await expectStatus("PATCH", "nilai/1", 403, {
					cookie: yudha,
					body: { score: 40 },
				});
				await expectStatus("POST", "nilai/2", 400, {
					cookie: ratih,
					body: { score: 101 },
				});
				await expectStatus("POST", "nilai/2", 201, {
					cookie: ratih,
					body: { score: 0 },
				});
				await expectStatus("PATCH", "nilai/2", 200, {
					cookie: ratih,
					body: { score: 84 },
				});
				await expectStatus("DELETE", "nilai/2", 403, {
					cookie: ratih,
					body: {},
				});
				assert.equal((await get(bima, "me")).study[0].score, 84);
			},
		);

		const registration = {
			program: "Informatika",
			cohort: 2025,
			status: "Cuti",
		};
		await t.test(
			"06 Registrasi berubah hanya lewat operator dan statusnya membatasi pengajuan",
			async () => {
				const initial = (await get(sinta, "registrasi")).records;
				assert.deepEqual(
					initial.map((row: { id: number }) => row.id),
					[102, 101],
				);
				await expectStatus("PATCH", "registrasi/101", 403, {
					cookie: nara,
					body: registration,
				});
				await expectStatus("PATCH", "registrasi/101", 403, {
					cookie: arya,
					body: registration,
				});
				await expectStatus("PATCH", "registrasi/101", 200, {
					cookie: sinta,
					body: registration,
				});
				assert.deepEqual((await get(nara, "me")).registration, registration);
				await expectStatus("POST", "krs/13", 409, { cookie: nara, body: {} });
				await expectStatus("PATCH", "registrasi/101", 200, {
					cookie: sinta,
					body: { ...registration, status: "Aktif" },
				});
			},
		);

		await t.test(
			"07 Administrator membuat, memperbarui, dan menonaktifkan akun nonadministrator",
			async () => {
				const initial = await get(arya, "akun");
				assert.equal(initial.accounts.length, 6);
				assert.equal(
					initial.accounts.some((account: object) =>
						Object.hasOwn(account, "password"),
					),
					false,
				);
				const body = {
					username: "demo-baru",
					name: "Akun Demo Baru",
					email: "baru@example.test",
					role: "mahasiswa",
					password,
				};
				await expectStatus("POST", "akun", 403, { cookie: sinta, body });
				await expectStatus("POST", "akun", 400, {
					cookie: arya,
					body: { ...body, role: "administrator" },
				});
				const created = await expectStatus("POST", "akun", 201, {
					cookie: arya,
					body,
				});
				await expectStatus("POST", "akun", 409, { cookie: arya, body });
				const newCookie = await signIn("demo-baru");
				assert.equal(
					(await get(newCookie, "me")).registration.status,
					"Nonaktif",
				);
				const update = {
					name: "Akun Demo Dinonaktifkan",
					email: body.email,
					active: false,
				};
				await expectStatus("PATCH", "akun/401", 403, {
					cookie: arya,
					body: update,
				});
				await expectStatus("PATCH", `akun/${created.value.id}`, 200, {
					cookie: arya,
					body: update,
				});
				await expectStatus("GET", "me", 401, { cookie: newCookie });
				await expectStatus("POST", "masuk", 401, {
					body: { username: body.username, password },
				});
				assert.equal(
					(await get(arya, "akun")).accounts.find(
						(account: { id: number }) => account.id === created.value.id,
					).name,
					update.name,
				);
			},
		);

		const configuration = {
			institution: "Institut Cakrawala Demo",
			krsOpen: false,
		};
		await t.test(
			"08 Perubahan konfigurasi mengendalikan periode KRS di server",
			async () => {
				await expectStatus("PATCH", "konfigurasi", 403, {
					cookie: sinta,
					body: configuration,
				});
				await expectStatus("PATCH", "konfigurasi", 200, {
					cookie: arya,
					body: configuration,
				});
				assert.deepEqual(await get(arya, "konfigurasi"), configuration);
				assert.equal((await get(nara, "krs")).krsOpen, false);
				await expectStatus("POST", "krs/13", 409, { cookie: nara, body: {} });
			},
		);

		await t.test(
			"09 Server menolak mutasi lintas asal dan mencabut sesi saat keluar",
			async () => {
				await expectStatus("PATCH", "konfigurasi", 403, {
					cookie: arya,
					body: configuration,
					origin: "http://contoh.invalid",
				});
				await expectStatus("POST", "keluar", 200, { cookie: yudha, body: {} });
				await expectStatus("GET", "me", 401, { cookie: yudha });
			},
		);

		await t.test(
			"10 Restart server mempertahankan konfigurasi dan nilai tersimpan",
			async () => {
				await stop();
				await start();
				assert.deepEqual(await get(arya, "konfigurasi"), configuration);
				assert.equal((await get(bima, "me")).study[0].score, 84);
				assert.equal((await get(nara, "krs")).krsOpen, false);
			},
		);
	} finally {
		await stop();
	}
});
