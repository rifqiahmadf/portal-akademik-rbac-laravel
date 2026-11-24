import { copyFileSync, existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { Client, escapeLiteral } from "pg";
import { hashPassword } from "../lib/crypto.ts";
import { demoAccounts, demoPassword } from "../lib/policy.ts";
import { postgresUrl } from "../lib/postgres-url.ts";

const tables = [
	{
		name: "users",
		columns: ["id", "username", "name", "email", "role", "password", "active"],
	},
	{
		name: "registrations",
		columns: ["student_id", "program", "cohort", "status"],
	},
	{
		name: "courses",
		columns: ["id", "code", "name", "credits", "schedule", "lecturer_id"],
	},
	{
		name: "enrollments",
		columns: ["id", "student_id", "course_id", "submitted_at"],
	},
	{ name: "grades", columns: ["enrollment_id", "score"] },
	{ name: "sessions", columns: ["token_hash", "user_id", "expires_at"] },
	{ name: "settings", columns: ["id", "institution", "krs_open"] },
] as const;

async function importLegacy(target: Client, source: string) {
	const directory = mkdtempSync(join(tmpdir(), "portal-rbac-legacy-"));
	const snapshot = join(directory, "legacy.sqlite");
	try {
		// The legacy app is stopped before cutover. Copy its WAL too, if present.
		copyFileSync(source, snapshot);
		if (existsSync(`${source}-wal`))
			copyFileSync(`${source}-wal`, `${snapshot}-wal`);
		const sqlite = new DatabaseSync(snapshot, { readOnly: true });
		try {
			if (sqlite.prepare("PRAGMA user_version").get()?.user_version !== 1) {
				throw new Error("Versi skema SQLite sumber tidak didukung.");
			}
			if (
				sqlite.prepare("PRAGMA quick_check").get()?.quick_check !== "ok" ||
				sqlite.prepare("PRAGMA foreign_key_check").get()
			) {
				throw new Error("Pemeriksaan integritas SQLite sumber gagal.");
			}

			const counts: string[] = [];
			for (const { name, columns } of tables) {
				const columnList = columns.join(", ");
				const statement = sqlite.prepare(
					`SELECT ${columnList} FROM ${name} ORDER BY 1`,
				);
				statement.setReadBigInts(true);
				const parameters = columns
					.map((_, index) => `$${index + 1}`)
					.join(", ");
				let count = 0;
				for (const row of statement.iterate()) {
					await target.query(
						`INSERT INTO public.${name} (${columnList}) VALUES (${parameters})`,
						columns.map((column) => row[column]),
					);
					count++;
				}
				counts.push(`${name}=${count}`);
			}
			if (
				!(await target.query("SELECT id FROM public.settings WHERE id = 1"))
					.rowCount
			) {
				throw new Error("Konfigurasi tidak ditemukan dalam SQLite sumber.");
			}
			console.log(
				`Baris yang dipindahkan dari SQLite ke PostgreSQL ${counts.join(", ")}`,
			);
		} finally {
			sqlite.close();
		}
	} finally {
		rmSync(directory, { recursive: true, force: true });
	}
}

async function seedDemo(db: Client) {
	for (const account of demoAccounts) {
		await db.query(
			"INSERT INTO public.users (id, username, name, email, role, password) VALUES ($1, $2, $3, $4, $5, $6)",
			[
				account.id,
				account.username,
				account.name,
				`${account.username}@akademik.example`,
				account.role,
				hashPassword(demoPassword),
			],
		);
	}
	await db.query(`
    INSERT INTO public.registrations (student_id, program, cohort, status) VALUES
      (101, 'Informatika', 2025, 'Aktif'), (102, 'Sistem Informasi', 2025, 'Aktif');
    INSERT INTO public.courses (id, code, name, credits, schedule, lecturer_id) VALUES
      (11, 'IF201', 'Basis Data', 3, 'Senin · 08.00', 201),
      (12, 'IF204', 'Pemrograman Web', 3, 'Rabu · 10.00', 202),
      (13, 'IF207', 'Keamanan Informasi', 3, 'Kamis · 13.00', 201),
      (14, 'IF212', 'Interaksi Manusia dan Komputer', 2, 'Jumat · 09.00', 202);
    INSERT INTO public.enrollments (id, student_id, course_id) VALUES (1,101,11), (2,102,11), (3,102,12);
    INSERT INTO public.grades (enrollment_id, score) VALUES (1, 88);
    INSERT INTO public.settings (id, institution, krs_open) VALUES (1, 'Institut Cakrawala', 1);
  `);
	console.log("Data demo baru disiapkan di PostgreSQL.");
}

async function grantAccess(db: Client, password: string) {
	const { rowCount } = await db.query(
		"SELECT 1 FROM pg_roles WHERE rolname = 'portal_app'",
	);
	if (!rowCount) await db.query("CREATE ROLE portal_app");
	await db.query(
		`ALTER ROLE portal_app LOGIN PASSWORD ${escapeLiteral(password)}`,
	);
	const database = await db.query<{ name: string }>(
		"SELECT format('%I', current_database()) AS name",
	);
	await db.query(
		`GRANT CONNECT ON DATABASE ${database.rows[0].name} TO portal_app`,
	);
	await db.query(`
    GRANT USAGE ON SCHEMA public TO portal_app;
    GRANT SELECT ON public.users, public.registrations, public.courses,
      public.enrollments, public.grades, public.sessions, public.settings TO portal_app;
    GRANT INSERT ON public.users, public.registrations, public.enrollments, public.grades, public.sessions TO portal_app;
    GRANT UPDATE ON public.users, public.registrations, public.grades, public.settings TO portal_app;
    GRANT DELETE ON public.sessions, public.enrollments TO portal_app;
    GRANT USAGE ON SEQUENCE public.users_id_seq, public.enrollments_id_seq TO portal_app;
  `);
}

const password = process.env.RBAC_APP_PASSWORD;
if (!password) throw new Error("RBAC_APP_PASSWORD wajib diisi.");
const db = new Client({ connectionString: postgresUrl() });
try {
	await db.connect();
	await db.query("BEGIN");
	await db.query("SELECT pg_advisory_xact_lock(84764201)");
	await db.query("SET LOCAL TIME ZONE 'UTC'");
	const initialized = await db.query(
		"SELECT 1 FROM public.settings WHERE id = 1",
	);
	if (!initialized.rowCount) {
		for (const { name } of tables) {
			if ((await db.query(`SELECT 1 FROM public.${name} LIMIT 1`)).rowCount) {
				throw new Error(
					"PostgreSQL berisi data tanpa konfigurasi. Inisialisasi dihentikan.",
				);
			}
		}
		const legacy = process.env.RBAC_LEGACY_DB;
		if (legacy && existsSync(legacy)) await importLegacy(db, legacy);
		else await seedDemo(db);
		for (const name of ["users", "enrollments"]) {
			const { rows } = await db.query(`
        SELECT setval(pg_get_serial_sequence('public.${name}', 'id'), COALESCE(MAX(id), 1), COUNT(*) > 0) AS value
        FROM public.${name}
      `);
			if (rows[0].value == null)
				throw new Error(`Sequence ID tidak tersedia untuk ${name}`);
		}
	} else {
		console.log("Basis data PostgreSQL sudah berisi data.");
	}
	await grantAccess(db, password);
	await db.query("COMMIT");
} catch (error) {
	await db.query("ROLLBACK").catch(() => undefined);
	throw error;
} finally {
	await db.end();
}
