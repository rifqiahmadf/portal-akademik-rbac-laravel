"use client";

import { GraduationCap, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, type ReactNode, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { demoAccounts, demoPassword, roleLabels } from "@/lib/policy";

async function call(
	path: string,
	method: string,
	payload: Record<string, unknown>,
) {
	const response = await fetch(`/api/${path}`, {
		method,
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload),
	});
	const result: { message: string } = await response.json();
	if (!response.ok) throw new Error(result.message);
	return result;
}

function errorMessage(error: unknown) {
	return error instanceof Error
		? error.message
		: "Terjadi kesalahan. Coba lagi.";
}

export function Brand({ institution }: { institution: string }) {
	return (
		<div className="flex min-w-0 items-center gap-3">
			<Avatar className="size-10 shrink-0 rounded-xl">
				<AvatarFallback className="rounded-xl bg-emerald-200 text-emerald-950">
					<GraduationCap className="size-5" aria-hidden />
				</AvatarFallback>
			</Avatar>
			<div className="min-w-0">
				<strong className="block text-sm font-semibold">Portal Akademik</strong>
				<span className="block truncate text-xs opacity-80">{institution}</span>
			</div>
		</div>
	);
}

function Feedback({ message, error }: { message: string; error?: boolean }) {
	return (
		<Alert
			role={error ? "alert" : "status"}
			variant={error ? "destructive" : "default"}
			className={error ? "mt-2" : "mt-2 border-emerald-200 bg-emerald-50"}
		>
			<AlertDescription className={error ? "" : "text-emerald-900"}>
				{message}
			</AlertDescription>
		</Alert>
	);
}

export function Login({ institution }: { institution: string }) {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [busy, setBusy] = useState(false);
	const primary = demoAccounts.filter((account) =>
		[101, 201, 301, 401].includes(account.id),
	);

	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setBusy(true);
		setError("");
		try {
			await call("masuk", "POST", { username, password });
			window.location.assign("/portal");
		} catch (err) {
			setError(errorMessage(err));
			setBusy(false);
		}
	}

	return (
		<main className="grid min-h-dvh md:grid-cols-[1fr_0.92fr]">
			<section className="portal-hero flex min-h-64 flex-col justify-between gap-8 px-6 py-7 text-white md:px-12 md:py-12 xl:px-20">
				<Brand institution={institution} />
				<div className="max-w-lg">
					<h1 className="text-5xl font-semibold tracking-tight sm:text-6xl xl:text-7xl">
						Portal Akademik
					</h1>
					<p className="mt-4 max-w-sm text-base leading-relaxed text-emerald-50/85">
						Akses KRS, nilai, registrasi, dan administrasi sesuai peran akun
						Anda.
					</p>
				</div>
				<p className="text-sm text-emerald-50/80">
					Lingkungan demo dengan data fiktif
				</p>
			</section>
			<section
				className="grid place-items-center bg-background p-5 sm:p-9"
				aria-labelledby="login-title"
			>
				<Card className="w-full max-w-md">
					<CardHeader>
						<CardTitle
							id="login-title"
							role="heading"
							aria-level={2}
							className="text-2xl"
						>
							Masuk ke portal
						</CardTitle>
						<CardDescription>Gunakan akun akademik Anda.</CardDescription>
					</CardHeader>
					<CardContent>
						<form className="grid gap-4" onSubmit={submit}>
							<Field>
								<FieldLabel htmlFor="username">Nama pengguna</FieldLabel>
								<Input
									id="username"
									autoComplete="username"
									value={username}
									onChange={(e) => setUsername(e.target.value)}
									required
								/>
							</Field>
							<Field>
								<FieldLabel htmlFor="password">Kata sandi</FieldLabel>
								<Input
									id="password"
									type="password"
									autoComplete="current-password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									required
								/>
							</Field>
							<Button className="w-full" disabled={busy}>
								{busy ? "Memproses…" : "Masuk"}
							</Button>
							{error && <Feedback message={error} error />}
						</form>
						<Separator className="my-6" />
						<p className="font-medium">Akun demo</p>
						<p className="mb-3 text-sm text-muted-foreground">
							Pilih peran untuk mengisi formulir.
						</p>
						<div className="grid grid-cols-2 gap-2">
							{primary.map((account) => (
								<Button
									key={account.id}
									type="button"
									variant="outline"
									className="h-auto min-h-12 flex-col items-start gap-0.5 py-2"
									disabled={busy}
									onClick={() => {
										setUsername(account.username);
										setPassword(demoPassword);
										setError("");
									}}
								>
									<span>{roleLabels[account.role]}</span>
									<span className="text-xs font-normal text-muted-foreground">
										{account.username}
									</span>
								</Button>
							))}
						</div>
					</CardContent>
				</Card>
			</section>
		</main>
	);
}

type MutationProps = {
	path: string;
	method?: "POST" | "PATCH" | "DELETE";
	types?: Record<string, "number" | "boolean">;
	reset?: boolean;
	className?: string;
	children: ReactNode;
};

export function MutationForm({
	path,
	method = "PATCH",
	types = {},
	reset = false,
	className,
	children,
}: MutationProps) {
	const router = useRouter();
	const [busy, setBusy] = useState(false);
	const [feedback, setFeedback] = useState<{
		message: string;
		error?: boolean;
	} | null>(null);

	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const form = event.currentTarget;
		const data = new FormData(form);
		const payload: Record<string, unknown> = Object.fromEntries(data);
		for (const [field, type] of Object.entries(types)) {
			payload[field] =
				type === "number" ? Number(data.get(field)) : data.has(field);
		}
		setBusy(true);
		setFeedback(null);
		try {
			const result = await call(path, method, payload);
			if (reset) form.reset();
			setFeedback({ message: result.message });
			router.refresh();
		} catch (err) {
			setFeedback({ message: errorMessage(err), error: true });
		} finally {
			setBusy(false);
		}
	}

	return (
		<form onSubmit={submit}>
			<fieldset className={className} disabled={busy} aria-busy={busy}>
				{children}
			</fieldset>
			{feedback && <Feedback {...feedback} />}
		</form>
	);
}

export function Logout() {
	const [error, setError] = useState("");
	const [busy, setBusy] = useState(false);
	return (
		<div>
			<Button
				className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
				variant="ghost"
				type="button"
				disabled={busy}
				onClick={async () => {
					setBusy(true);
					setError("");
					try {
						await call("keluar", "POST", {});
						window.location.assign("/");
					} catch {
						setError("Gagal keluar. Coba lagi.");
						setBusy(false);
					}
				}}
			>
				<LogOut aria-hidden />
				Keluar
			</Button>
			{error && <Feedback message={error} error />}
		</div>
	);
}
