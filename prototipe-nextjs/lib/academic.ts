import { hashPassword } from "./crypto";
import {
	type Action,
	isRole,
	programs,
	type Resource,
	registrationStatuses,
	roles,
} from "./policy";
import { type Database, prisma, write } from "./prisma";
import { getUser, type User } from "./session";
import {
	authorize,
	choice,
	emailField,
	fail,
	fields,
	integer,
	recordId,
	textField,
	toggle,
} from "./validation";

const managedRoles = roles.filter((role) => role !== "administrator");

async function settings(db: Database) {
	const [row] = await db.query(
		db.sql.public.settings
			.select("institution", "krs_open")
			.where((f, q) => q.eq(f.id, 1))
			.build(),
	);
	if (!row) throw new Error("Konfigurasi akademik tidak ditemukan.");
	return { institution: row.institution, krsOpen: row.krs_open === 1 };
}

export async function institutionName() {
	return (await settings(prisma)).institution;
}

function ownStudy(studentId: number) {
	const { enrollments, courses, grades, users } = prisma.sql.public;
	return prisma.query(
		enrollments
			.innerJoin(courses, (f, q) => q.eq(f.enrollments.course_id, f.courses.id))
			.innerJoin(users, (f, q) => q.eq(f.courses.lecturer_id, f.users.id))
			.outerLeftJoin(grades, (f, q) =>
				q.eq(f.grades.enrollment_id, f.enrollments.id),
			)
			.select((f) => ({
				id: f.courses.id,
				code: f.courses.code,
				name: f.courses.name,
				credits: f.courses.credits,
				schedule: f.courses.schedule,
				lecturer_code: f.courses.lecturer_id,
				lecturer: f.users.name,
				score: f.score,
			}))
			.where((f, q) => q.eq(f.student_id, studentId))
			.orderBy("code")
			.build(),
	);
}

function ownRegistration(studentId: number) {
	return prisma.query(
		prisma.sql.public.registrations
			.select("program", "cohort", "status")
			.where((f, q) => q.eq(f.student_id, studentId))
			.build(),
	);
}

const readers = {
	async me(user: User, key?: string) {
		if (key && recordId(key) !== user.id)
			fail(403, "Profil hanya dapat diakses oleh pemilik akun.");
		if (user.role !== "mahasiswa") return { profile: user };
		const [[registration], study] = await Promise.all([
			ownRegistration(user.id),
			ownStudy(user.id),
		]);
		return { profile: user, registration, study };
	},
	async krs(user: User) {
		const { courses, users } = prisma.sql.public;
		const [config, [registration], study, options] = await Promise.all([
			settings(prisma),
			ownRegistration(user.id),
			ownStudy(user.id),
			prisma.query(
				courses
					.innerJoin(users, (f, q) => q.eq(f.courses.lecturer_id, f.users.id))
					.select((f) => ({
						id: f.courses.id,
						code: f.code,
						name: f.courses.name,
						credits: f.credits,
						schedule: f.schedule,
						lecturer_code: f.courses.lecturer_id,
						lecturer: f.users.name,
					}))
					.orderBy("code")
					.build(),
			),
		]);
		return {
			krsOpen: config.krsOpen,
			registrationStatus: registration?.status,
			study,
			courses: options,
		};
	},
	async nilai(user: User, key?: string) {
		const { enrollments, courses, users, grades } = prisma.sql.public;
		const classId = key ? recordId(key) : undefined;
		const classes = await prisma.query(
			courses
				.select("id", "code", "name", "lecturer_id", "credits", "schedule")
				.where((f, q) =>
					classId === undefined
						? q.eq(f.lecturer_id, user.id)
						: q.and(q.eq(f.lecturer_id, user.id), q.eq(f.id, classId)),
				)
				.orderBy("code")
				.build(),
		);
		if (key && classes.length === 0)
			fail(403, "Anda hanya dapat melihat kelas yang Anda ampu.");
		return {
			classes: await Promise.all(
				classes.map(async (course) => ({
					...course,
					lecturer_name: user.name,
					participants: await prisma.query(
						enrollments
							.innerJoin(users, (f, q) =>
								q.eq(f.enrollments.student_id, f.users.id),
							)
							.outerLeftJoin(grades, (f, q) =>
								q.eq(f.grades.enrollment_id, f.enrollments.id),
							)
							.select((f) => ({
								id: f.enrollments.id,
								name: f.name,
								student_id: f.users.id,
								score: f.score,
							}))
							.where((f, q) => q.eq(f.course_id, course.id))
							.orderBy("name")
							.build(),
					),
				})),
			),
		};
	},
	async registrasi() {
		const { registrations, users } = prisma.sql.public;
		const records = await prisma.query(
			registrations
				.innerJoin(users, (f, q) =>
					q.eq(f.registrations.student_id, f.users.id),
				)
				.select("id", "name", "program", "cohort", "status")
				.orderBy("name")
				.build(),
		);
		return { records };
	},
	async akun() {
		const accounts = await prisma.query(
			prisma.sql.public.users
				.select("id", "username", "name", "email", "role", "active")
				.orderBy("name")
				.build(),
		);
		return {
			accounts: accounts.flatMap((account) =>
				isRole(account.role) ? [{ ...account, role: account.role }] : [],
			),
		};
	},
	konfigurasi: () => settings(prisma),
} satisfies Record<Resource, (user: User, key?: string) => Promise<unknown>>;

export type ResourceData = {
	[K in Resource]: Awaited<ReturnType<(typeof readers)[K]>>;
};

export function readFor<R extends Resource>(
	user: User | null,
	resource: R,
	key?: string,
): Promise<ResourceData[R]>;
export function readFor(user: User | null, resource: Resource, key?: string) {
	authorize(user, resource, "view");
	if (key && resource !== "me" && resource !== "nilai")
		fail(404, "Halaman tidak ditemukan.");
	return readers[resource](user, key);
}

async function changeStudy(
	db: Database,
	user: User,
	action: Action,
	key: string | undefined,
	payload: unknown,
) {
	fields(payload, []);
	const courseId = recordId(key);
	if (!(await settings(db)).krsOpen) fail(409, "Periode KRS sedang ditutup.");
	const { enrollments, grades, registrations, courses } = db.sql.public;
	const [enrollment] = await db.query(
		enrollments
			.outerLeftJoin(grades, (f, q) =>
				q.eq(f.grades.enrollment_id, f.enrollments.id),
			)
			.select("id", "score")
			.where((f, q) =>
				q.and(q.eq(f.student_id, user.id), q.eq(f.course_id, courseId)),
			)
			.build(),
	);
	if (action === "remove") {
		if (!enrollment) fail(404, "Kelas tersebut tidak ada dalam KRS Anda.");
		if (enrollment.score !== null)
			fail(409, "Pengajuan yang sudah memiliki nilai tidak dapat ditarik.");
		await db.execute(
			enrollments
				.delete()
				.where((f, q) => q.eq(f.id, enrollment.id))
				.build(),
		);
		return { message: "Pengajuan KRS ditarik." };
	}
	const [registration] = await db.query(
		registrations
			.select("status")
			.where((f, q) => q.eq(f.student_id, user.id))
			.build(),
	);
	if (registration?.status !== "Aktif")
		fail(409, "Registrasi harus aktif untuk mengajukan KRS.");
	const [course] = await db.query(
		courses
			.select("id")
			.where((f, q) => q.eq(f.id, courseId))
			.build(),
	);
	if (!course) fail(404, "Kelas tidak ditemukan.");
	if (enrollment) fail(409, "Kelas sudah ada dalam KRS Anda.");
	await db.execute(
		enrollments.insert([{ student_id: user.id, course_id: courseId }]).build(),
	);
	return { message: "Kelas berhasil diajukan." };
}

async function changeGrade(
	db: Database,
	user: User,
	action: Action,
	key: string | undefined,
	payload: unknown,
) {
	const id = recordId(key);
	const { enrollments, courses, grades } = db.sql.public;
	const [enrollment] = await db.query(
		enrollments
			.innerJoin(courses, (f, q) => q.eq(f.enrollments.course_id, f.courses.id))
			.outerLeftJoin(grades, (f, q) =>
				q.eq(f.grades.enrollment_id, f.enrollments.id),
			)
			.select((f) => ({ id: f.enrollments.id, score: f.score }))
			.where((f, q) =>
				q.and(q.eq(f.enrollments.id, id), q.eq(f.lecturer_id, user.id)),
			)
			.build(),
	);
	if (!enrollment)
		fail(
			403,
			"Anda hanya dapat memberi nilai kepada peserta kelas yang Anda ampu.",
		);
	const score = integer(fields(payload, ["score"]).score, "Nilai", 0, 100);
	if (action === "add") {
		if (enrollment.score !== null)
			fail(409, "Nilai sudah ada. Gunakan tindakan ubah.");
		await db.execute(
			grades.insert([{ enrollment_id: enrollment.id, score }]).build(),
		);
	} else {
		if (enrollment.score === null)
			fail(409, "Nilai belum ada. Gunakan tindakan tambah.");
		await db.execute(
			grades
				.update({ score })
				.where((f, q) => q.eq(f.enrollment_id, enrollment.id))
				.build(),
		);
	}
	return { message: "Nilai disimpan." };
}

async function changeRegistration(
	db: Database,
	key: string | undefined,
	payload: unknown,
) {
	const id = recordId(key);
	const { program, cohort, status } = fields(payload, [
		"program",
		"cohort",
		"status",
	]);
	const result = await db.execute(
		db.sql.public.registrations
			.update({
				program: choice(program, "Program studi", programs),
				cohort: integer(cohort, "Angkatan", 2000, 2100),
				status: choice(status, "Status registrasi", registrationStatuses),
			})
			.where((f, q) => q.eq(f.student_id, id))
			.build(),
	);
	if (!result.affectedRows) fail(404, "Registrasi mahasiswa tidak ditemukan.");
	return { message: "Registrasi diperbarui." };
}

async function changeAccount(
	db: Database,
	action: Action,
	key: string | undefined,
	payload: unknown,
) {
	const { users, registrations, sessions } = db.sql.public;
	if (action === "add") {
		if (key) fail(404, "Halaman tidak ditemukan.");
		const { username, name, email, role, password } = fields(payload, [
			"username",
			"name",
			"email",
			"role",
			"password",
		]);
		const login = textField(username, "Nama pengguna", 3, 32).toLowerCase();
		if (!/^[a-z0-9._-]+$/.test(login))
			fail(
				400,
				"Nama pengguna hanya boleh berisi huruf, angka, titik, setrip, atau garis bawah.",
			);
		const address = emailField(email);
		const accountRole = choice(role, "Peran akun", managedRoles);
		if (
			typeof password !== "string" ||
			password.length < 12 ||
			password.length > 128
		) {
			fail(400, "Kata sandi harus berisi 12–128 karakter.");
		}
		const [duplicate] = await db.query(
			users
				.select("id")
				.where((f, q) => q.or(q.eq(f.username, login), q.eq(f.email, address)))
				.limit(1)
				.build(),
		);
		if (duplicate) fail(409, "Nama pengguna atau email sudah dipakai.");
		const [created] = await db.query(
			users
				.insert([
					{
						username: login,
						name: textField(name, "Nama lengkap", 2, 80),
						email: address,
						role: accountRole,
						password: hashPassword(password),
					},
				])
				.returning("id")
				.build(),
		);
		if (!created) throw new Error("Akun tidak tersimpan.");
		const { id } = created;
		if (accountRole === "mahasiswa") {
			await db.execute(
				registrations
					.insert([
						{
							student_id: id,
							program: programs[0],
							cohort: 2026,
							status: "Nonaktif",
						},
					])
					.build(),
			);
		}
		return { message: "Akun dibuat.", id };
	}
	const id = recordId(key);
	const [target] = await db.query(
		users
			.select("role")
			.where((f, q) => q.eq(f.id, id))
			.build(),
	);
	if (!target) fail(404, "Akun tidak ditemukan.");
	if (target.role === "administrator")
		fail(403, "Perubahan akun administrator tidak tersedia di portal ini.");
	const { name, email, active } = fields(payload, ["name", "email", "active"]);
	const address = emailField(email);
	const [duplicate] = await db.query(
		users
			.select("id")
			.where((f, q) => q.and(q.eq(f.email, address), q.ne(f.id, id)))
			.limit(1)
			.build(),
	);
	if (duplicate) fail(409, "Email sudah dipakai.");
	const enabled = toggle(active, "Status akun");
	await db.execute(
		users
			.update({
				name: textField(name, "Nama lengkap", 2, 80),
				email: address,
				active: enabled,
			})
			.where((f, q) => q.eq(f.id, id))
			.build(),
	);
	if (!enabled)
		await db.execute(
			sessions
				.delete()
				.where((f, q) => q.eq(f.user_id, id))
				.build(),
		);
	return { message: "Akun diperbarui." };
}

export function changeFor(
	token: string | undefined,
	resource: Resource,
	key: string | undefined,
	action: Action,
	payload: unknown,
) {
	return write(async (tx) => {
		const user = await getUser(token, tx);
		authorize(user, resource, action);
		switch (resource) {
			case "krs":
				return changeStudy(tx, user, action, key, payload);
			case "nilai":
				return changeGrade(tx, user, action, key, payload);
			case "registrasi":
				return changeRegistration(tx, key, payload);
			case "akun":
				return changeAccount(tx, action, key, payload);
			case "konfigurasi": {
				if (key) fail(404, "Halaman tidak ditemukan.");
				const { institution, krsOpen } = fields(payload, [
					"institution",
					"krsOpen",
				]);
				await tx.execute(
					tx.sql.public.settings
						.update({
							institution: textField(institution, "Nama institusi", 2, 80),
							krs_open: toggle(krsOpen, "Periode KRS"),
						})
						.where((f, q) => q.eq(f.id, 1))
						.build(),
				);
				return { message: "Konfigurasi disimpan." };
			}
			case "me":
				fail(403, "Profil hanya dapat dilihat.");
		}
	});
}
