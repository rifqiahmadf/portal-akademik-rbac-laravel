export function postgresUrl() {
	if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

	const url = new URL("postgresql://localhost:5432");
	url.hostname = process.env.PGHOST ?? "localhost";
	url.port = process.env.PGPORT ?? "5432";
	url.pathname = `/${encodeURIComponent(process.env.PGDATABASE ?? "akademik")}`;
	url.username = process.env.PGUSER ?? "portal_app";
	url.password = process.env.PGPASSWORD ?? "";
	return url.href;
}
