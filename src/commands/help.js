export function helpHandler() {
	return {
		usage: [
			["usage --days <number>", "Show usage for the last N days"],
			["usage --from <date> --to <date>", "Show usage between two dates"]
		],

		interface: [
			["interface --days <number>", "Show interface usage for the last N days"],
			["interface --from <date> --to <date>", " Show interface usage between two dates"],
		],

		monitoring: [
			["speed", "Show current network speed"],
			["speed --watch", "Continously show current network speed"],
			["session", "Show current session usage"],
			["status", "Show current Net Limiter status"]
		],

		limit: [
			["limit set --amount <GB> --days <number>", "Set a usage limit for N days"],
			["limit set --amount <GB> --from <date> --to <date>", "Set a usage limit for a date range"],
			["limit get", "Show current usage limit"]
		],

		notification: [
			["notification enable", "Enable usage notifications"],
			["notification disable", "Disable usage notifications"],
			["notification --threshold <GB>", "Set notification threshold"]
		],

		general: [
			["help", "Show this help message"]
		]
	};
}
