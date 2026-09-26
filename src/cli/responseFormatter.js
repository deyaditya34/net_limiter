import Table from "cli-table3";

export function formatResponse(request, response) {
	if (!response.success) {
		return;
	}

	switch (request.command) {
		case "usage":
			return formatUsage(response.data);

		case "speed":
			return formatSpeed(response.data);

		case "limit":
			return formatLimit(response.data);

		case "session":
			return formatSession(response.data);

		case "status":
			return formatStatus(response.data);

		case "notification":
			return formatNotification(response.data);

		case "interface":
			return formatInterface(response.data);

		case "help":
			return formatHelp(response.data);
	}
}

function formatUsage(data) {
	const table = new Table({
		head: ["Type", "Download", "Upload", "Total"]
	});

	table.push(
		[
			"Total",
			data.totalDownload,
			data.totalUpload,
			data.totalUsage,
		],
		[
			"Wi-Fi",
			data.wifiDownload,
			data.wifiUpload,
			data.wifiUsage,
		],
		[
			"Ethernet",
			data.ethernetDownload,
			data.ethernetUpload,
			data.ethernetUsage,
		],
	);

	return table.toString();

}

function formatInterface(data) {
	const table = new Table({
		head: ["Type", "Download", "Upload", "Total"],
	});

	table.push(
		[
			"Wi-Fi",
			data.wifiDownload,
			data.wifiUpload,
			data.wifiUsage,
		],
		[
			"Ethernet",
			data.ethernetDownload,
			data.ethernetUpload,
			data.ethernetUsage,
		],
	);

	return table.toString();
}

function formatSpeed(data) {
	const table = new Table({
		head: ["Interface", "Download", "Upload"],
	});

	for (const [interfaceName, speed] of Object.entries(data)) {
		table.push([
			interfaceName,
			speed.download,
			speed.upload,
		]);
	}

	return table.toString();
}

function formatLimit(data) {
	if (typeof data === "string") {
		return data;
	}

	const table = new Table({
		head: ["Metric", "Value"],
	});

	table.push(
		["Start Date", data.startDate],
		["End Date", data.endDate],
		["Limit", data.limit],
		["Used", data.usedGb],
		["Remaining", data.remaining],
		["Usage", data.percentage],
	);

	return table.toString();
}

function formatSession(data) {
	const table = new Table({
		head: ["Metric", "Value"],
	});

	table.push(
		["Started", data.startDate],
		["Download", data.download],
		["Upload", data.upload],
	);

	return table.toString();
}

function formatStatus(data) {
	const todayTable = new Table({
		head: ["Date", "Download", "Upload", "Total"],
	});

	todayTable.push([
		data.today.date,
		data.today.download,
		data.today.upload,
		data.today.total
	]);

	const speedTable = new Table({
		head: ["Interface", "Download", "Upload"],
	});

	for (const [interfaceName, speed] of Object.entries(data.speed)) {
		speedTable.push([
			interfaceName,
			speed.download,
			speed.upload,
		]);
	}

	const sessionTable = new Table({
		head: ["Started", "Download", "Upload"],
	});

	sessionTable.push([
		data.session.startDate,
		data.session.download,
		data.session.upload,
	]);

	const notificationTable = new Table({
		head: ["Enabled", "Threshold"],
	});

	notificationTable.push([
		data.notification.enabled ? "Yes" : "No",
		data.notification.threshold,
	]);

	return [
		"Today",
		todayTable.toString(),
		"",
		"Speed",
		speedTable.toString(),
		"",
		"Session",
		sessionTable.toString(),
		"",
		"Notification",
		notificationTable.toString(),
	].join("\n");
}

function formatNotification(data) {
	const table = new Table({
		head: ["Property", "Value"],
	});

	table.push(
		["Enabled", data.enabled ? "Yes" : "No"],
		["Threshold", data.threshold],
	);

	return table.toString();
}

function formatHelp(data) {
	const sections = [
		["Usage", data.usage],
		["Interface", data.interface],
		["Monitoring", data.monitoring],
		["Limit", data.limit],
		["Notification", data.notification],
		["General", data.general],
	];

	const output = [];

	for (const [section, commands] of sections) {
		const table = new Table({
			head: ["Command", "Description"],
		});

		for (const [command, description] of commands) {
			table.push([command, description]);
		}

		output.push(section);
		output.push(table.toString());
		output.push("");
	}

	return output.join("\n");
};

