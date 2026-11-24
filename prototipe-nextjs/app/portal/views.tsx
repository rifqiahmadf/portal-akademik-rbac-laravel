import Link from "next/link";
import type { ReactNode } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	NativeSelect,
	NativeSelectOption,
} from "@/components/ui/native-select";
import { Separator } from "@/components/ui/separator";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { type ResourceData, readFor } from "@/lib/academic";
import {
	type Action,
	can,
	modules,
	operations,
	type PortalSection,
	programs,
	type Role,
	registrationStatuses,
	resources,
	roleLabels,
	roles,
	sectionHref,
} from "@/lib/policy";
import type { User } from "@/lib/session";
import { MutationForm } from "../client";
import { NavIcon } from "./navigation";

function Panel({
	title,
	children,
	trailing,
}: {
	title: string;
	children: ReactNode;
	trailing?: ReactNode;
}) {
	return (
		<Card className="min-w-0 overflow-hidden">
			<CardHeader className="flex items-center justify-between">
				<CardTitle role="heading" aria-level={2}>
					{title}
				</CardTitle>
				{trailing}
			</CardHeader>
			<CardContent>{children}</CardContent>
		</Card>
	);
}

function DataTable({
	headers,
	children,
	className,
}: {
	headers: string[];
	children: ReactNode;
	className?: string;
}) {
	return (
		<Table className={className}>
			<TableHeader>
				<TableRow>
					{headers.map((header) => (
						<TableHead scope="col" key={header}>
							{header}
						</TableHead>
					))}
				</TableRow>
			</TableHeader>
			<TableBody>{children}</TableBody>
		</Table>
	);
}

function RowTitle({
	children,
	subtitle,
}: {
	children: ReactNode;
	subtitle?: ReactNode;
}) {
	return (
		<th scope="row" className="whitespace-normal p-2 text-left font-medium">
			{children}
			{subtitle && (
				<span className="block text-xs font-normal text-muted-foreground">
					{subtitle}
				</span>
			)}
		</th>
	);
}

function Empty({ children }: { children: ReactNode }) {
	return <p className="py-2 text-sm text-muted-foreground">{children}</p>;
}

function scheduleRange(schedule: string, credits: number) {
	const match =
		/^(.*?)\s*[·•]\s*(\d{1,2})[.:](\d{2})(?:\s*[–-]\s*(\d{1,2})[.:](\d{2}))?$/.exec(
			schedule,
		);
	if (!match || credits < 1) return schedule;

	const [, day, startHour, startMinute, existingEndHour, existingEndMinute] =
		match;
	const pad = (value: number) => String(value).padStart(2, "0");
	const start = `${pad(Number(startHour))}.${startMinute}`;
	if (existingEndHour && existingEndMinute) {
		return `${day} · ${start}–${pad(Number(existingEndHour))}.${existingEndMinute}`;
	}

	const endMinutes =
		Number(startHour) * 60 + Number(startMinute) + credits * 50;
	if (endMinutes >= 24 * 60) return schedule;
	return `${day} · ${start}–${pad(Math.floor(endMinutes / 60))}.${pad(endMinutes % 60)}`;
}

function Overview({ user }: { user: User }) {
	const available = resources.filter((resource) =>
		can(user.role, resource, "view"),
	);
	return (
		<>
			<Card className="portal-hero min-h-56 justify-center border-0 px-5 text-white ring-0 sm:px-9">
				<CardHeader>
					<p className="text-sm font-medium text-emerald-100">
						Ruang kerja {roleLabels[user.role].toLowerCase()}
					</p>
					<h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
						Selamat datang, {user.name.split(" ")[0]}.
					</h1>
					<CardDescription className="text-base text-emerald-50/85">
						Pilih layanan untuk mulai bekerja di semester ini.
					</CardDescription>
				</CardHeader>
			</Card>
			<section className="space-y-3" aria-labelledby="services-heading">
				<div className="flex items-center justify-between gap-2">
					<h2 id="services-heading" className="text-lg font-semibold">
						Layanan tersedia
					</h2>
					<Badge variant="secondary">{roleLabels[user.role]}</Badge>
				</div>
				<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
					{available.map((resource) => (
						<Card
							key={resource}
							className="transition-colors hover:bg-muted/70"
						>
							<CardHeader>
								<div className="mb-2 grid size-10 place-items-center rounded-lg bg-secondary text-primary [&>svg]:size-5">
									<NavIcon section={resource} />
								</div>
								<CardTitle>{modules[resource].label}</CardTitle>
								<CardDescription>
									{modules[resource].description}
								</CardDescription>
							</CardHeader>
							<CardContent>
								<Button variant="outline" asChild>
									<Link href={sectionHref(resource)}>
										Buka {modules[resource].label.toLowerCase()}
									</Link>
								</Button>
							</CardContent>
						</Card>
					))}
				</div>
			</section>
			<Card>
				<CardHeader>
					<CardTitle>Matriks akses</CardTitle>
					<CardDescription>
						Lihat izin dan cakupan data untuk keempat peran.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Button variant="outline" asChild>
						<Link href="/portal/matriks">Buka matriks akses</Link>
					</Button>
				</CardContent>
			</Card>
		</>
	);
}

function Details({ entries }: { entries: [string, ReactNode][] }) {
	return (
		<dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
			{entries.map(([label, value]) => (
				<div key={label} className="min-w-0 space-y-1">
					<dt className="text-sm text-muted-foreground">{label}</dt>
					<dd className="font-medium wrap-anywhere">{value}</dd>
				</div>
			))}
		</dl>
	);
}

function Profile({ data }: { data: ResourceData["me"] }) {
	const { profile, registration, study } = data;
	return (
		<>
			<Panel title="Identitas akun">
				<Details
					entries={[
						["Nama lengkap", profile.name],
						["Nama pengguna", profile.username],
						["Email", profile.email],
						["Peran", roleLabels[profile.role]],
					]}
				/>
			</Panel>
			{registration && (
				<Panel title="Registrasi saya">
					<Details
						entries={[
							["Nomor mahasiswa", profile.id],
							["Program studi", registration.program],
							["Angkatan", registration.cohort],
							[
								"Status registrasi",
								<Badge key="registration-status" variant="secondary">
									{registration.status}
								</Badge>,
							],
						]}
					/>
				</Panel>
			)}
			{study && (
				<Panel title="Nilai saya">
					{study.length ? (
						<DataTable headers={["Mata kuliah", "SKS", "Nilai"]}>
							{study.map((course) => (
								<TableRow key={course.id}>
									<RowTitle subtitle={course.code}>{course.name}</RowTitle>
									<TableCell>{course.credits}</TableCell>
									<TableCell>{course.score ?? "Belum dinilai"}</TableCell>
								</TableRow>
							))}
						</DataTable>
					) : (
						<Empty>Belum ada kelas yang diajukan.</Empty>
					)}
				</Panel>
			)}
		</>
	);
}

function Study({ data }: { data: ResourceData["krs"] }) {
	const { krsOpen, registrationStatus, study, courses } = data;
	const selected = new Set(study.map((course) => course.id));
	const available = courses.filter((course) => !selected.has(course.id));
	const credits = study.reduce((total, course) => total + course.credits, 0);
	return (
		<>
			<Alert className="flex items-center justify-between gap-3 border-primary/15 bg-secondary/70">
				<div>
					<AlertTitle>Periode pengajuan</AlertTitle>
					<AlertDescription>
						{registrationStatus === "Aktif"
							? "Registrasi Anda aktif."
							: "Registrasi harus aktif untuk mengajukan kelas."}
					</AlertDescription>
				</div>
				<Badge variant={krsOpen ? "default" : "outline"}>
					{krsOpen ? "Terbuka" : "Ditutup"}
				</Badge>
			</Alert>
			<Panel
				title="KRS saya"
				trailing={<Badge variant="secondary">{credits} SKS</Badge>}
			>
				{study.length ? (
					<DataTable
						headers={[
							"Kode kelas",
							"Mata kuliah",
							"Dosen",
							"Jadwal",
							"SKS",
							"Status",
							"Tindakan",
						]}
						className="study-table"
					>
						{study.map((course) => (
							<TableRow key={course.id}>
								<TableCell data-label="Kode kelas">{course.code}</TableCell>
								<RowTitle>{course.name}</RowTitle>
								<TableCell data-label="Dosen">
									{course.lecturer} ({course.lecturer_code})
								</TableCell>
								<TableCell data-label="Jadwal">
									{scheduleRange(course.schedule, course.credits)}
								</TableCell>
								<TableCell data-label="SKS">{course.credits}</TableCell>
								<TableCell data-label="Status">
									<Badge variant="secondary">
										{course.score == null ? "Diajukan" : "Sudah dinilai"}
									</Badge>
								</TableCell>
								<TableCell>
									{krsOpen && course.score == null ? (
										<MutationForm path={`krs/${course.id}`} method="DELETE">
											<Button variant="outline" size="sm">
												Tarik pengajuan
											</Button>
										</MutationForm>
									) : (
										<span className="no-action">—</span>
									)}
								</TableCell>
							</TableRow>
						))}
					</DataTable>
				) : (
					<Empty>Belum ada kelas yang diajukan.</Empty>
				)}
			</Panel>
			<Panel title="Kelas tersedia">
				{available.length ? (
					<DataTable
						headers={[
							"Kode kelas",
							"Mata kuliah",
							"Dosen",
							"Jadwal",
							"SKS",
							"Tindakan",
						]}
						className="study-table"
					>
						{available.map((course) => (
							<TableRow key={course.id}>
								<TableCell data-label="Kode kelas">{course.code}</TableCell>
								<RowTitle>{course.name}</RowTitle>
								<TableCell data-label="Dosen">
									{course.lecturer} ({course.lecturer_code})
								</TableCell>
								<TableCell data-label="Jadwal">
									{scheduleRange(course.schedule, course.credits)}
								</TableCell>
								<TableCell data-label="SKS">{course.credits}</TableCell>
								<TableCell>
									{krsOpen && registrationStatus === "Aktif" ? (
										<MutationForm path={`krs/${course.id}`} method="POST">
											<Button size="sm">Ajukan kelas</Button>
										</MutationForm>
									) : (
										<span className="no-action">—</span>
									)}
								</TableCell>
							</TableRow>
						))}
					</DataTable>
				) : (
					<Empty>Semua kelas sudah ada dalam KRS Anda.</Empty>
				)}
			</Panel>
		</>
	);
}

function Grades({ data }: { data: ResourceData["nilai"] }) {
	if (!data.classes.length)
		return (
			<Panel title="Kelas ampuan">
				<Empty>Belum ada kelas yang ditugaskan.</Empty>
			</Panel>
		);
	return data.classes.map((course) => (
		<Panel
			key={course.id}
			title={course.name}
			trailing={<Badge variant="secondary">{course.code}</Badge>}
		>
			<div className="mb-4 grid gap-3 rounded-lg bg-muted/50 p-3 text-sm sm:grid-cols-3">
				<p>
					<span className="block text-xs text-muted-foreground">
						Kode kelas
					</span>
					<strong>{course.code}</strong>
				</p>
				<p>
					<span className="block text-xs text-muted-foreground">Dosen</span>
					<strong>
						{course.lecturer_name} ({course.lecturer_id})
					</strong>
				</p>
				<p>
					<span className="block text-xs text-muted-foreground">Jadwal</span>
					<strong>{scheduleRange(course.schedule, course.credits)}</strong>
				</p>
			</div>
			{course.participants.length ? (
				<DataTable headers={["Mahasiswa", "Nilai", "Tindakan"]}>
					{course.participants.map((student) => (
						<TableRow key={student.id}>
							<RowTitle subtitle={`No. ${student.student_id}`}>
								{student.name}
							</RowTitle>
							<TableCell>{student.score ?? "Belum dinilai"}</TableCell>
							<TableCell>
								<MutationForm
									path={`nilai/${student.id}`}
									method={student.score == null ? "POST" : "PATCH"}
									types={{ score: "number" }}
									className="flex items-center gap-2"
								>
									<Input
										className="w-20"
										name="score"
										type="number"
										min="0"
										max="100"
										defaultValue={student.score ?? ""}
										aria-label={`Nilai untuk ${student.name}`}
										required
									/>
									<Button variant="outline" size="sm">
										{student.score == null ? "Tambah nilai" : "Ubah nilai"}
									</Button>
								</MutationForm>
							</TableCell>
						</TableRow>
					))}
				</DataTable>
			) : (
				<Empty>Belum ada peserta yang mengajukan kelas ini.</Empty>
			)}
		</Panel>
	));
}

function SelectField({
	id,
	label,
	name,
	options,
	value,
}: {
	id: string;
	label: string;
	name: string;
	options: readonly string[];
	value: string;
}) {
	return (
		<Field>
			<FieldLabel htmlFor={id}>{label}</FieldLabel>
			<NativeSelect className="w-full" id={id} name={name} defaultValue={value}>
				{options.map((option) => (
					<NativeSelectOption key={option}>{option}</NativeSelectOption>
				))}
			</NativeSelect>
		</Field>
	);
}

function Registrations({ data }: { data: ResourceData["registrasi"] }) {
	return (
		<Panel
			title="Data mahasiswa"
			trailing={
				<Badge variant="secondary">{data.records.length} registrasi</Badge>
			}
		>
			<div className="space-y-4">
				{data.records.map((record, index) => (
					<article key={record.id} className="space-y-3">
						{index > 0 && <Separator />}
						<div className="flex items-baseline gap-2">
							<strong>{record.name}</strong>
							<span className="text-xs text-muted-foreground">
								No. {record.id}
							</span>
						</div>
						<MutationForm
							path={`registrasi/${record.id}`}
							types={{ cohort: "number" }}
							className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-[1.2fr_0.65fr_0.9fr_auto]"
						>
							<SelectField
								id={`program-${record.id}`}
								label="Program studi"
								name="program"
								options={programs}
								value={record.program}
							/>
							<Field>
								<FieldLabel htmlFor={`cohort-${record.id}`}>
									Angkatan
								</FieldLabel>
								<Input
									id={`cohort-${record.id}`}
									name="cohort"
									type="number"
									min="2000"
									max="2100"
									defaultValue={record.cohort}
									required
								/>
							</Field>
							<SelectField
								id={`status-${record.id}`}
								label="Status"
								name="status"
								options={registrationStatuses}
								value={record.status}
							/>
							<Button className="justify-self-start" variant="outline">
								Simpan
							</Button>
						</MutationForm>
					</article>
				))}
			</div>
		</Panel>
	);
}

function Accounts({ data }: { data: ResourceData["akun"] }) {
	return (
		<>
			<Panel
				title="Daftar akun"
				trailing={
					<Badge variant="secondary">{data.accounts.length} akun</Badge>
				}
			>
				<div className="space-y-4">
					{data.accounts.map((account, index) => (
						<article key={account.id} className="space-y-3">
							{index > 0 && <Separator />}
							<div className="flex flex-wrap items-baseline gap-2">
								<strong>@{account.username}</strong>
								<span className="text-xs text-muted-foreground">
									{roleLabels[account.role]}
								</span>
							</div>
							{account.role === "administrator" ? (
								<div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
									<span>{account.name}</span>
									<span className="text-muted-foreground">{account.email}</span>
									<Badge variant="secondary">Dilindungi</Badge>
								</div>
							) : (
								<MutationForm
									path={`akun/${account.id}`}
									types={{ active: "boolean" }}
									className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_auto]"
								>
									<Field>
										<FieldLabel htmlFor={`name-${account.id}`}>
											Nama lengkap
										</FieldLabel>
										<Input
											id={`name-${account.id}`}
											name="name"
											defaultValue={account.name}
											minLength={2}
											maxLength={80}
											required
										/>
									</Field>
									<Field>
										<FieldLabel htmlFor={`email-${account.id}`}>
											Email
										</FieldLabel>
										<Input
											id={`email-${account.id}`}
											name="email"
											type="email"
											defaultValue={account.email}
											maxLength={100}
											required
										/>
									</Field>
									<Field orientation="horizontal" className="h-8">
										<Checkbox
											id={`active-${account.id}`}
											name="active"
											defaultChecked={Boolean(account.active)}
										/>
										<FieldLabel htmlFor={`active-${account.id}`}>
											Aktif
										</FieldLabel>
									</Field>
									<Button className="justify-self-start" variant="outline">
										Simpan
									</Button>
								</MutationForm>
							)}
						</article>
					))}
				</div>
			</Panel>
			<Panel title="Buat akun">
				<MutationForm
					path="akun"
					method="POST"
					reset
					className="grid items-end gap-4 sm:grid-cols-2"
				>
					<Field>
						<FieldLabel htmlFor="new-username">Nama pengguna</FieldLabel>
						<Input
							id="new-username"
							name="username"
							autoComplete="off"
							minLength={3}
							maxLength={32}
							required
						/>
					</Field>
					<Field>
						<FieldLabel htmlFor="new-name">Nama lengkap</FieldLabel>
						<Input
							id="new-name"
							name="name"
							minLength={2}
							maxLength={80}
							required
						/>
					</Field>
					<Field>
						<FieldLabel htmlFor="new-email">Email</FieldLabel>
						<Input
							id="new-email"
							name="email"
							type="email"
							maxLength={100}
							required
						/>
					</Field>
					<Field>
						<FieldLabel htmlFor="new-account-role">Peran</FieldLabel>
						<NativeSelect className="w-full" id="new-account-role" name="role">
							{roles
								.filter((role) => role !== "administrator")
								.map((role) => (
									<NativeSelectOption key={role} value={role}>
										{roleLabels[role]}
									</NativeSelectOption>
								))}
						</NativeSelect>
					</Field>
					<Field>
						<FieldLabel htmlFor="new-password">Kata sandi awal</FieldLabel>
						<Input
							id="new-password"
							name="password"
							type="password"
							autoComplete="new-password"
							minLength={12}
							maxLength={128}
							placeholder="Minimal 12 karakter"
							required
						/>
					</Field>
					<Button className="justify-self-start">Buat akun</Button>
				</MutationForm>
			</Panel>
		</>
	);
}

function Configuration({ data }: { data: ResourceData["konfigurasi"] }) {
	return (
		<Panel title="Pengaturan akademik">
			<MutationForm
				path="konfigurasi"
				types={{ krsOpen: "boolean" }}
				className="grid max-w-lg gap-4"
			>
				<Field>
					<FieldLabel htmlFor="institution">Nama institusi</FieldLabel>
					<Input
						id="institution"
						name="institution"
						defaultValue={data.institution}
						minLength={2}
						maxLength={80}
						required
					/>
				</Field>
				<Field orientation="horizontal">
					<Checkbox
						id="krs-open"
						name="krsOpen"
						defaultChecked={data.krsOpen}
					/>
					<FieldLabel htmlFor="krs-open">Buka periode pengajuan KRS</FieldLabel>
				</Field>
				<Button className="justify-self-start">Simpan konfigurasi</Button>
			</MutationForm>
		</Panel>
	);
}

function Matrix({ role }: { role: Role }) {
	return (
		<>
			<Panel title="Izin menurut peran">
				<DataTable
					headers={["Aktivitas", ...roles.map((item) => roleLabels[item])]}
					className="min-w-[47.5rem] table-fixed"
				>
					{resources.map((resource) => (
						<TableRow key={resource}>
							<RowTitle>{modules[resource].activity}</RowTitle>
							{roles.map((item) => (
								<TableCell
									key={item}
									className={
										"align-top whitespace-normal " +
										(item === role ? "bg-secondary/70" : "")
									}
								>
									{Object.entries(modules[resource].access[item] ?? {}).map(
										([action, scope]) => (
											<div className="mb-2 last:mb-0" key={action}>
												<strong className="text-primary">
													{operations[action as Action]}
												</strong>
												<span className="block text-xs text-muted-foreground">
													{scope}
												</span>
											</div>
										),
									)}
									{!modules[resource].access[item] && (
										<span>
											<span className="sr-only">Tidak ada izin</span>
											<span aria-hidden="true">—</span>
										</span>
									)}
								</TableCell>
							))}
						</TableRow>
					))}
				</DataTable>
			</Panel>
			<Panel title="Prinsip least privilege">
				<Empty>
					Setiap peran menerima izin minimum yang dibutuhkan. Server memeriksa
					kepemilikan data dan penugasan kelas. Tanda garis menunjukkan
					aktivitas tanpa izin untuk peran tersebut.
				</Empty>
			</Panel>
		</>
	);
}

export async function Content({
	section,
	user,
}: {
	section: PortalSection;
	user: User;
}) {
	switch (section) {
		case "ringkasan":
			return <Overview user={user} />;
		case "me":
			return <Profile data={await readFor(user, section)} />;
		case "krs":
			return <Study data={await readFor(user, section)} />;
		case "nilai":
			return <Grades data={await readFor(user, section)} />;
		case "registrasi":
			return <Registrations data={await readFor(user, section)} />;
		case "akun":
			return <Accounts data={await readFor(user, section)} />;
		case "konfigurasi":
			return <Configuration data={await readFor(user, section)} />;
		case "matriks":
			return <Matrix role={user.role} />;
	}
}
