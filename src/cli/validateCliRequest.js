export function validateCLIRequest(request) {
	if (!request || typeof request !== "object") {
		throw new Error("Invalid request");
	}

	if (typeof request.command !== "string") {
		throw new Error("Command is required");
	}

	const options = request.options ?? {};
	const subCommand = request.subCommand;

	switch (request.command) {
		case "usage":
		case "interface":
			validateDateOption(options);
			break;

		case "limit":
			validateLimitRequest(subCommand, options);
			break;

		case "notification":
			validateNotificationRequest(subCommand, options);
			break;

		case "speed":
		case "status":
		case "session":
		case "help":
			break;

		default:
			throw new Error(`unknown command: '${request.command}'`);
	}
}

function validateDateOption(options) {
	const hasDays = options.days !== undefined;
	const hasDateRange = options.from !== undefined && options.to != undefined;

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
	}
}

function validateLimitRequest(subCommand, options) {
	if (subCommand === "set") {
		const hasAmount = options.amount !== undefined;
		const hasDays = options.days !== undefined;
		const hasDateRange = options.from !== undefined && options.to !== undefined;

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
		}
	}
	else if (subCommand === "get") {
		return;
	}
	else {
		throw new Error(`unknown sub command - '${subCommand}'`);
	}
}

function validateNotificationRequest(subCommand, options) {
	if (subCommand !== undefined) {
		if (subCommand !== "enable" && subCommand !== "disable") {
			throw new Error(`unknown sub command - '${subCommand}'`);
		}
	}

	if (options.threshold !== undefined) {
		const threshold = Number(options.threshold);

		if (threshold <= 0 || Number.isNaN(threshold)) {
			throw new Error("error: invalid threshold");
		}
	}
}
