import { type NextRequest, NextResponse } from "next/server";
import { changeFor, institutionName, readFor } from "@/lib/academic";
import { type Action, isResource } from "@/lib/policy";
import {
	authenticate,
	getUser,
	revokeSession,
	sessionCookie,
	sessionSeconds,
} from "@/lib/session";
import { authorize, fields, RequestError, textField } from "@/lib/validation";

const actions: Readonly<Record<string, Action | undefined>> = {
	GET: "view",
	HEAD: "view",
	POST: "add",
	PATCH: "edit",
	DELETE: "remove",
};
const cookieOptions = {
	httpOnly: true,
	sameSite: "lax",
	path: "/",
	secure: false,
} as const;

function json(body: unknown, status = 200) {
	return NextResponse.json(body, {
		status,
		headers: { "Cache-Control": "no-store" },
	});
}

function checkOrigin(request: NextRequest) {
	const origin = request.headers.get("origin");
	const expected = `${new URL(request.url).protocol}//${request.headers.get("host")}`;
	if (origin !== expected)
		throw new RequestError(403, "Asal permintaan tidak diizinkan.");
}

async function input(request: NextRequest): Promise<unknown> {
	if (
		!request.headers
			.get("content-type")
			?.toLowerCase()
			.startsWith("application/json")
	) {
		throw new RequestError(415, "Gunakan isi permintaan JSON.");
	}
	try {
		return await request.json();
	} catch {
		throw new RequestError(400, "JSON tidak valid.");
	}
}

async function handle(
	request: NextRequest,
	{ params }: { params: Promise<{ resource: string[] }> },
) {
	try {
		const [resource, key, ...extra] = (await params).resource;
		const action = actions[request.method];
		const token = request.cookies.get(sessionCookie)?.value;
		if (!resource || extra.length)
			throw new RequestError(404, "Halaman tidak ditemukan.");
		if (!action) throw new RequestError(405, "Metode tidak diizinkan.");
		if (action !== "view") checkOrigin(request);
		if (resource === "health" && !key && action === "view") {
			await institutionName();
			return json({ status: "ok" });
		}
		if (resource === "masuk" && !key && action === "add") {
			const { username, password } = fields(await input(request), [
				"username",
				"password",
			]);
			if (
				typeof password !== "string" ||
				password.length < 1 ||
				password.length > 128
			) {
				throw new RequestError(400, "Isikan kata sandi yang valid.");
			}
			const nextToken = await authenticate(
				textField(username, "Nama pengguna", 3, 32).toLowerCase(),
				password,
				token,
			);
			if (!nextToken)
				throw new RequestError(
					401,
					"Nama pengguna atau kata sandi tidak cocok, atau akun nonaktif.",
				);
			const response = json({ message: "Berhasil masuk." });
			response.cookies.set(sessionCookie, nextToken, {
				...cookieOptions,
				maxAge: sessionSeconds,
			});
			return response;
		}
		if (resource === "keluar" && !key && action === "add") {
			await revokeSession(token);
			const response = json({ message: "Sesi diakhiri." });
			response.cookies.set(sessionCookie, "", { ...cookieOptions, maxAge: 0 });
			return response;
		}
		if (!isResource(resource))
			throw new RequestError(404, "Halaman tidak ditemukan.");
		const user = await getUser(token);
		if (action === "view") return json(await readFor(user, resource, key));
		authorize(user, resource, action);
		const result = await changeFor(
			token,
			resource,
			key,
			action,
			await input(request),
		);
		return json(result, action === "add" ? 201 : 200);
	} catch (error) {
		if (error instanceof RequestError)
			return json({ message: error.message }, error.status);
		console.error("Portal RBAC:", error);
		return json({ message: "Terjadi kesalahan pada server." }, 500);
	}
}

export { handle as GET, handle as POST, handle as PATCH, handle as DELETE };
