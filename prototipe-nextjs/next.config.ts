import type { NextConfig } from "next";

const config: NextConfig = {
	output: "standalone",
	poweredByHeader: false,
	experimental: { cpus: 2, useTypeScriptCli: true },
	serverExternalPackages: ["@prisma/orm-postgres"],
};

export default config;
