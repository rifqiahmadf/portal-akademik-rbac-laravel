"use client";

import {
	BookOpen,
	ClipboardList,
	GraduationCap,
	LayoutDashboard,
	Settings,
	ShieldCheck,
	UserRound,
	UsersRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { type PortalSection, sectionHref, sectionLabel } from "@/lib/policy";

const icons = {
	ringkasan: LayoutDashboard,
	me: UserRound,
	krs: BookOpen,
	nilai: GraduationCap,
	registrasi: ClipboardList,
	akun: UsersRound,
	konfigurasi: Settings,
	matriks: ShieldCheck,
};

export function NavIcon({ section }: { section: PortalSection }) {
	const Icon = icons[section];
	return <Icon aria-hidden />;
}

export function PortalNavigation({ sections }: { sections: PortalSection[] }) {
	const pathname = usePathname();
	const { setOpenMobile } = useSidebar();
	return (
		<nav aria-label="Menu utama">
			<SidebarGroup>
				<SidebarGroupLabel className="text-sidebar-foreground/70">
					Menu utama
				</SidebarGroupLabel>
				<SidebarMenu>
					{sections.map((section) => {
						const url = sectionHref(section);
						const active = pathname === url;
						return (
							<SidebarMenuItem key={section}>
								<SidebarMenuButton asChild isActive={active} size="default">
									<Link
										href={url}
										aria-current={active ? "page" : undefined}
										onClick={() => setOpenMobile(false)}
									>
										<NavIcon section={section} />
										<span>{sectionLabel(section)}</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						);
					})}
				</SidebarMenu>
			</SidebarGroup>
		</nav>
	);
}
