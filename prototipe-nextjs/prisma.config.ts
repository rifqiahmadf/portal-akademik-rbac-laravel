import { defineConfig } from "@prisma/orm-postgres/config";
import { definePrismaConfig } from "prisma/config";
import { postgresUrl } from "./lib/postgres-url.ts";

export default definePrismaConfig({
	orm: defineConfig({
		contract: "./prisma/contract.prisma",
		db: { connection: postgresUrl() },
	}),
});
