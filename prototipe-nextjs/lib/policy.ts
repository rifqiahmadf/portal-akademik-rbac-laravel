export const roles = [
	"mahasiswa",
	"dosen",
	"operator",
	"administrator",
] as const;
export type Role = (typeof roles)[number];

export function isRole(value: string): value is Role {
	return roles.some((role) => role === value);
}
export const roleLabels: Record<Role, string> = {
	mahasiswa: "Mahasiswa",
	dosen: "Dosen",
	operator: "Operator",
	administrator: "Administrator",
};

export const operations = {
	view: "Lihat",
	add: "Tambah",
	edit: "Ubah",
	remove: "Hapus",
} as const;
export type Action = keyof typeof operations;
export const semester = "Ganjil 2026/2027";

export const resources = [
	"me",
	"krs",
	"nilai",
	"registrasi",
	"akun",
	"konfigurasi",
] as const;
export type Resource = (typeof resources)[number];
export type PortalSection = "ringkasan" | "matriks" | Resource;

type Module = {
	label: string;
	activity: string;
	description: string;
	access: Partial<Record<Role, Partial<Record<Action, string>>>>;
};

export const modules: Record<Resource, Module> = {
	me: {
		label: "Profil saya",
		activity: "Lihat data sendiri",
		description:
			"Identitas akun dan data akademik yang terkait dengan profil Anda.",
		access: {
			mahasiswa: { view: "Akun, registrasi, dan nilai sendiri" },
			dosen: { view: "Akun sendiri" },
			operator: { view: "Akun sendiri" },
			administrator: { view: "Akun sendiri" },
		},
	},
	krs: {
		label: "Kartu rencana studi",
		activity: "Ajukan KRS",
		description: "Pilih kelas dan kelola pengajuan studi semester ini.",
		access: {
			mahasiswa: {
				view: "Kelas tersedia dan KRS sendiri",
				add: "KRS sendiri saat periode buka dan registrasi aktif",
				remove: "KRS sendiri tanpa nilai saat periode buka",
			},
		},
	},
	nilai: {
		label: "Penilaian",
		activity: "Input nilai",
		description: "Catat dan perbarui nilai mahasiswa di kelas yang Anda ampu.",
		access: {
			dosen: {
				view: "Peserta dan nilai di kelas ampuan",
				add: "Nilai pertama peserta kelas ampuan",
				edit: "Nilai peserta kelas ampuan",
			},
		},
	},
	registrasi: {
		label: "Registrasi",
		activity: "Ubah data registrasi",
		description:
			"Kelola program studi, angkatan, dan status registrasi mahasiswa.",
		access: {
			operator: {
				view: "Registrasi mahasiswa",
				edit: "Program studi, angkatan, dan status",
			},
		},
	},
	akun: {
		label: "Manajemen akun",
		activity: "Kelola akun",
		description: "Buat dan kelola akun pengguna untuk sistem akademik.",
		access: {
			administrator: {
				view: "Ringkasan semua akun",
				add: "Akun nonadministrator",
				edit: "Identitas dan status akun nonadministrator",
			},
		},
	},
	konfigurasi: {
		label: "Konfigurasi",
		activity: "Konfigurasi sistem",
		description: "Atur nama institusi dan ketersediaan pengajuan KRS.",
		access: {
			administrator: {
				view: "Konfigurasi sistem",
				edit: "Nama institusi dan periode KRS",
			},
		},
	},
};

export function isResource(value: string): value is Resource {
	return resources.some((resource) => resource === value);
}

export function can(role: Role, resource: Resource, action: Action) {
	const access = modules[resource].access[role];
	return Boolean(access && Object.hasOwn(access, action));
}

export const programs = [
	"Informatika",
	"Sistem Informasi",
	"Teknik Komputer",
] as const;
export const registrationStatuses = ["Aktif", "Cuti", "Nonaktif"] as const;
export const demoPassword = "AkademikDemo!26";
export const demoAccounts = [
	{ id: 101, username: "nara", name: "Nara Pradipta", role: "mahasiswa" },
	{ id: 102, username: "bima", name: "Bima Arunika", role: "mahasiswa" },
	{ id: 201, username: "ratih", name: "Ratih Adinata", role: "dosen" },
	{ id: 202, username: "yudha", name: "Yudha Wiratama", role: "dosen" },
	{ id: 301, username: "sinta", name: "Sinta Maheswari", role: "operator" },
	{ id: 401, username: "arya", name: "Arya Pamungkas", role: "administrator" },
] as const;

export function sectionLabel(section: PortalSection) {
	if (section === "ringkasan") return "Ringkasan";
	if (section === "matriks") return "Matriks akses";
	return modules[section].label;
}

export function sectionHref(section: PortalSection) {
	return section === "ringkasan" ? "/portal" : `/portal/${section}`;
}
