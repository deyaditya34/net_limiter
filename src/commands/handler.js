import { calculateSpeed } from "../network/speed.js";
import { getUsageSummary, getUsageBetweenDates, formatUsage } from "../storage/usageHistory.js";
import { getLimit, setLimit } from "../network/limit.js";
import { formatSessionUsage } from "../network/session.js";
import { calculateDatesFromNoOfDays } from "../utils/date.js";
import { STATE } from "../state/state.js";
import { ONE_GB } from "../config/constants.js";

export async function handleRequest(request) {
	let options;
	let hasDays;
	let hasDateRange;
	let usage;
	let subCommand;
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
			subCommand = request.subCommand;
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

		case "session":
			return formatSessionUsage();

		case "status":
			return {
				today: {
					date: STATE.trackingDate,
					download: STATE.daily.download,
					upload: STATE.daily.upload,
					total: STATE.daily.download + STATE.daily.upload
				},
				speed: STATE.currentSpeed,
				session: formatSessionUsage(),
				notification: {
					threshold: `${(STATE.notification.threshold / ONE_GB).toFixed(2)} GB`,
					enabled: STATE.notification.enabled
				}
			}

		case "notification":
			subCommand = request.subCommand;
			options = request.options;
			result = {};

			if (subCommand) {
				if (subCommand === "enable") {
					STATE.notification.enabled = true;
					result.message = "notification enabled";
				}
				else if (subCommand === "disable") {
					STATE.notification.enabled = false;
					result.message = "notification disabled";
				} else {
					throw new Error("Error: unknown subcommand");
				}
			}

			if (options) {
				const hasThreshold = options.threshold !== undefined;

				if (hasThreshold && Number(options.threshold) > 0) {
					STATE.notification.threshold = options.threshold * 1000000000;
					result.threshold = `threshold set for '${options.threshold}' GB`;
				} else {
					throw new Error("Error: unknown command");
				}
			}

			return result;

		default:
			throw new Error(`Unknown Command: ${request.command}`);
	}
}
