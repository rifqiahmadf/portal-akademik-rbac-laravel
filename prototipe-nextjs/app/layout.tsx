import type { Metadata } from "next";
import type { ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./style.css";

export const metadata: Metadata = {
	title: "Portal Akademik",
	description:
		"Portal akademik untuk demonstrasi kontrol akses berbasis peran.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="id">
			<body>
				<TooltipProvider>{children}</TooltipProvider>
			</body>
		</html>
	);
}
