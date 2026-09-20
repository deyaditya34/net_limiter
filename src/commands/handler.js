import { calculateSpeed } from "../network/speed.js";
import { getUsageSummary, getUsageBetweenDates, formatUsage } from "../storage/usageHistory.js";
import { getLimit, setLimit } from "../network/limit.js";
import { calculateDatesFromNoOfDays } from "../utils/date.js";
import { STATE } from "../state/state.js";

export async function handleRequest(request) {
	let options;
	let hasDays;
	let hasDateRange;
	let usage;
	let result;

	switch (request.command) {
		case "usage":
			options = request.options;

			hasDays = options.days !== undefined;
			hasDateRange = options.from !== undefined && options.from !== undefined;

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

				usage = await getUsageSummary(options.days);
				result = formatUsage(usage);
				return {
					totalDownload: result.totalDownload,
					totalUpload: result.totalUpload
				}
			}

			usage = await getUsageBetweenDates(options.from, options.to);
			result = formatUsage(usage);
			return {
				totalDownload: result.totalDownload,
				totalUpload: result.totalUpload
			}

		case "interface":
			options = request.options;

			hasDays = options.days !== undefined;
			hasDateRange = options.from !== undefined && options.from !== undefined;

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

				usage = await getUsageSummary(options.days);
				result = formatUsage(usage);
				return {
					wifiUsage: result.wifiUsage,
					ethernetUsage: result.ethernetUsage,
					wifiDownload: result.wifiDownload,
					wifiUpload: result.wifiUpload,
					ethernetDownload: result.ethernetDownload,
					ethernetUpload: result.ethernetUpload
				}
			}

			usage = await getUsageBetweenDates(options.from, options.to);
			result = formatUsage(usage);
			return {
				wifiUsage: result.wifiUsage,
				ethernetUsage: result.ethernetUsage,
				wifiDownload: result.wifiDownload,
				wifiUpload: result.wifiUpload,
				ethernetDownload: result.ethernetDownload,
				ethernetUpload: result.ethernetUpload
			}

		case "speed":
			return STATE.currentSpeed;

		case "limit":
			const subCommand = request.subCommand;
			if (subCommand === "set") {
				options = request.options;

				let hasAmount = options.amount !== undefined;
				hasDays = options.days !== undefined;
				hasDateRange = options.from !== undefined && options.from !== undefined;

				if (!hasAmount) {
					throw new Error("Amount is needed for the limit to be set");
				}

				if (options.amount <= 0) {
					throw new Error("amount must be greater than 0");
				}

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

					const { sanitizedStartDate, sanitizedEndDate } = calculateDatesFromNoOfDays(options.days, 1);
					return await setLimit(sanitizedStartDate, sanitizedEndDate, options.amount);
				}

				return await setLimit(options.from, options.to, options.amount);
			} 

			else if (subCommand === "get") {
				return await getLimit();
			} 

			else {
				throw new Error(`ERROR: unknown sub command - '${subCommand}`);
			}

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
