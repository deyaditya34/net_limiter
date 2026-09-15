import { saveState } from "../storage/state.js";

process.on("SIGINT", async () => {
	saveState();
	process.exit(0);
});
process.on("SIGTERM", async () => {
	saveState();
	process.exit(0);
});
process.on("uncaughtException", async (err) => {
	await saveState();
	process.exit(0);
});
process.on("unhandledRejection", async (err) => {
	await saveState();
	process.exit(0);
});

