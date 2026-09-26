import { getUsageSummary, getUsageBetweenDates, formatUsage } from "../storage/usageHistory.js";
import { sanitizeDate } from "../utils/date.js";

export async function usageHandler(options) {
	let usage;

	if (options.days !== undefined) {
		usage = await getUsageSummary(options.days);
	} else {
		usage = await getUsageBetweenDates(sanitizeDate(options.from), sanitizeDate(options.to));
	}

	const result = formatUsage(usage);
	return result;
}
