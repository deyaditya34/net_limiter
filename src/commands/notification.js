export function notificationHandler(subCommand, options, STATE) {
	let result = {};
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
}
