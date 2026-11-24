import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export default function NotFound() {
	return (
		<main className="grid min-h-80 place-items-center p-6">
			<Card className="w-full max-w-lg">
				<CardHeader>
					<CardTitle role="heading" aria-level={1} className="text-2xl">
						Halaman tidak tersedia
					</CardTitle>
					<CardDescription>
						Periksa alamat atau gunakan menu yang tersedia untuk akun Anda.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Button asChild>
						<Link href="/portal">Kembali ke ringkasan</Link>
					</Button>
				</CardContent>
			</Card>
		</main>
	);
}
