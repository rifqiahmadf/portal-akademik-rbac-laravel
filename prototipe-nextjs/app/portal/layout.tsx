import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarInset,
	SidebarProvider,
} from "@/components/ui/sidebar";
import { institutionName } from "@/lib/academic";
import { can, resources } from "@/lib/policy";
import { getUser, sessionCookie } from "@/lib/session";
import { Brand, Logout } from "../client";
import { PortalNavigation } from "./navigation";

export default async function PortalLayout({
	children,
}: {
	children: ReactNode;
}) {
	const cookieJar = await cookies();
	const user = await getUser(cookieJar.get(sessionCookie)?.value);
	if (!user) redirect("/");
	const institution = await institutionName();
	return (
		<SidebarProvider
			defaultOpen={cookieJar.get("sidebar_state")?.value !== "false"}
		>
			<Sidebar>
				<SidebarHeader className="px-4 pt-5">
					<Brand institution={institution} />
				</SidebarHeader>
				<SidebarContent className="pt-4">
					<PortalNavigation
						sections={[
							"ringkasan",
							...resources.filter((resource) =>
								can(user.role, resource, "view"),
							),
							"matriks",
						]}
					/>
				</SidebarContent>
				<SidebarFooter className="gap-3 border-t border-sidebar-border p-3">
					<div className="flex min-w-0 items-center gap-2 px-2">
						<Avatar>
							<AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground">
								{user.name
									.split(" ")
									.slice(0, 2)
									.map((word) => word[0])
									.join("")}
							</AvatarFallback>
						</Avatar>
						<div className="min-w-0">
							<strong className="block truncate text-sm">{user.name}</strong>
							<span className="block truncate text-xs text-sidebar-foreground/70">
								@{user.username}
							</span>
						</div>
					</div>
					<Logout />
				</SidebarFooter>
			</Sidebar>
			<SidebarInset className="min-w-0 bg-background">{children}</SidebarInset>
		</SidebarProvider>
	);
}
