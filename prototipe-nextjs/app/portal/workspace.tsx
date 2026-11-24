import { cookies } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
	can,
	isResource,
	modules,
	type PortalSection,
	roleLabels,
	sectionLabel,
	semester,
} from "@/lib/policy";
import { getUser, sessionCookie } from "@/lib/session";
import { Content } from "./views";

function isSection(section: string): section is PortalSection {
	return (
		section === "ringkasan" || section === "matriks" || isResource(section)
	);
}

export function sectionMetadata(section: string) {
	return {
		title: isSection(section)
			? `${sectionLabel(section)} · Portal Akademik`
			: "Portal Akademik",
	};
}

export async function PortalPage({ section }: { section: string }) {
	const user = await getUser((await cookies()).get(sessionCookie)?.value);
	if (!user) redirect("/");
	if (
		!isSection(section) ||
		(isResource(section) && !can(user.role, section, "view"))
	)
		notFound();
	const title = sectionLabel(section);
	return (
		<>
			<header className="flex min-h-16 flex-wrap items-center justify-between gap-2 border-b bg-card px-4 py-2 sm:px-7">
				<div className="flex items-center gap-2">
					<SidebarTrigger aria-label="Buka atau tutup menu" />
					<Breadcrumb aria-label="Lokasi">
						<BreadcrumbList>
							<BreadcrumbItem>
								<BreadcrumbLink asChild>
									<Link href="/portal">Portal Akademik</Link>
								</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator />
							<BreadcrumbItem>
								<BreadcrumbPage>{title}</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
				</div>
				<Badge variant="outline" className="font-medium">
					{semester}
				</Badge>
			</header>
			<div className="mx-auto w-full max-w-7xl space-y-5 p-4 sm:p-7" id="main">
				{section !== "ringkasan" && (
					<header className="space-y-2">
						<p className="text-xs font-semibold tracking-widest text-primary uppercase">
							{roleLabels[user.role]}
						</p>
						<h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
							{title}
						</h1>
						<p className="text-muted-foreground">
							{isResource(section)
								? modules[section].description
								: "Lihat tindakan dan cakupan data yang diizinkan untuk setiap peran."}
						</p>
					</header>
				)}
				<Content section={section} user={user} />
			</div>
		</>
	);
}
