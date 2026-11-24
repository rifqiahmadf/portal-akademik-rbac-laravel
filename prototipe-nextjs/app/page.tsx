import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { institutionName } from "@/lib/academic";
import { getUser, sessionCookie } from "@/lib/session";
import { Login } from "./client";

export default async function HomePage() {
	const user = await getUser((await cookies()).get(sessionCookie)?.value);
	if (user) redirect("/portal");
	return <Login institution={await institutionName()} />;
}
