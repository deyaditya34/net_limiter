import { calculateSpeed } from "../network/speed.js";
import { getUsageSummary, getUsageBetweenDates } from "../commands/usage.js";
import { calculateLimit } from "../commands/limit.js";

export async function handleRequest(request) {
	switch (request.command) {
		case "usage":
			const options = request.options;

			const hasDays = options.days !== undefined;
			const hasDateRange = options.from !== undefined && options.from !== undefined;

			if (!hasDays && !hasDateRange) {
				throw new Error("Usage requires either 'days' or both 'from' and 'to'");
			}

			if (hasDays && hasDateRange) {
				throw new Error("Usage cannot use 'days' together with 'from' and 'to'");
			}

			if (hasDays) {
				if (!Number.isInteger(options.days) || options.days <= 0) {
					throw new Error("'days' must be a positive integer");
				}
				return await getUsageSummary(options.days);
			}

			return await getUsageBetweenDates(options.from, options.to);

		case "speed":
			return {
				download: 20,
				upload: 10
			};

		case "summary":
			return {
				days: 10,
				downloadTotal: 4000,
				uploadTotal: 3500
			};

		default:
			throw new Error(`Unknown Command: ${request.command}`);
	}
}
