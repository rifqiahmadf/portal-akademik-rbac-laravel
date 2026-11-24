import postgres from "@prisma/orm-postgres/runtime";
import { contractFromJson } from "@prisma/orm-postgres/static";
import type { Contract } from "../prisma/contract.d.ts";
import contractJson from "../prisma/contract.json" with { type: "json" };
import { postgresUrl } from "./postgres-url";

const contract = contractFromJson<Contract>(contractJson);

function connect() {
	return postgres({ contract, url: postgresUrl(), verifyMarker: false });
}

const instance = globalThis as typeof globalThis & {
	portalPrisma?: ReturnType<typeof connect>;
};

let prismaInstance = instance.portalPrisma;
if (!prismaInstance) {
	prismaInstance = connect();
	instance.portalPrisma = prismaInstance;
}

export const prisma = prismaInstance;
export type Database = Pick<typeof prisma, "query" | "execute" | "sql">;
type Transaction = Parameters<Parameters<typeof prisma.transaction>[0]>[0];

export function write<T>(
	operation: (tx: Transaction) => Promise<T>,
): Promise<T> {
	return prisma.transaction(async (tx) => {
		// Shared rules, such as whether KRS is open, must stay consistent across concurrent writes.
		const [settings] = await tx.query(
			tx.sql.public.settings
				.select("id")
				.where((fields, sql) => sql.eq(fields.id, 1))
				.forUpdate()
				.build(),
		);
		if (!settings)
			throw new Error("Konfigurasi akademik belum diinisialisasi.");
		return operation(tx);
	});
}
