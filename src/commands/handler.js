import { calculateSpeed } from "../network/speed.js";
import { getUsageSummary, getUsageBetweenDates, formatUsage } from "../storage/usageHistory.js";
import { getLimit, setLimit } from "../network/limit.js";
import { formatSessionUsage } from "../network/session.js";
import { displayHelp } from "../commands/help.js";
import { calculateDatesFromNoOfDays, sanitizeDate } from "../utils/date.js";
import { STATE } from "../state/state.js";
import { ONE_GB } from "../config/constants.js";

export async function handleRequest(request) {
	let options;
	let usage;
	let subCommand;
	let result;

	switch (request.command) {
		case "usage":
			options = request.options;

			if (options.days !== undefined) {
				usage = await getUsageSummary(options.days);
			} else {
				usage = await getUsageBetweenDates(sanitizeDate(options.from), sanitizeDate(options.to));
			}
			result = formatUsage(usage);
			return result;

		case "interface":
			options = request.options;

			if (options.days !== undefined) {
				usage = await getUsageSummary(options.days);
			}
			else {
				usage = await getUsageBetweenDates(options.from, options.to);
			}

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

				if (options.days !== undefined) {
					const { sanitizedStartDate, sanitizedEndDate } = calculateDatesFromNoOfDays(options.days, 1);
					return await setLimit(sanitizedStartDate, sanitizedEndDate, options.amount);
				} else {
					return await setLimit(options.from, options.to, options.amount);
				}
			}

			return await getLimit();

		case "session":
			return formatSessionUsage();

		case "status":
			return {
				today: {
					date: STATE.trackingDate,
					download: `${(STATE.daily.download / ONE_GB).toFixed(2)} GB`,
					upload: `${(STATE.daily.upload / ONE_GB).toFixed(2)} GB`,
					total: `${((STATE.daily.download + STATE.daily.upload) / ONE_GB).toFixed(2)} GB`
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
				}
				else if (subCommand === "disable") {
					STATE.notification.enabled = false;
				}
			}

			if (options.threshold !== undefined) {
				STATE.notification.threshold = options.threshold * ONE_GB;
			}

			result.enabled = STATE.notification.enabled;
			result.threshold = `'${STATE.notification.threshold / ONE_GB}GB'`;

			return result;

		case "help":
			return displayHelp();

		default:
			throw new Error(`Unknown Command: ${request.command}`);
	}
}
