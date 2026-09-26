import { STATE } from "../state/state.js";
import { helpHandler } from "../commands/help.js";
import { usageHandler } from "./usage.js";
import { interfaceHandler } from "./interface.js";
import { speedHandler } from "./speed.js";
import { limitHandler } from "./limit.js";
import { sessionHandler } from "./session.js";
import { statusHandler } from "./status.js";
import { notificationHandler } from "./notification.js";

export async function handleRequest(request) {
	let options;
	let usage;
	let subCommand;
	let result;

	switch (request.command) {
		case "usage":
			result = await usageHandler(request.options);
			console.log("result -", result);
			return result;

		case "interface":
			result = await interfaceHandler(request.options);
			return result;

		case "speed":
			result = speedHandler(STATE);
			return result;

		case "limit":
			result = await limitHandler(request.subCommand, request.options);
			return result;

		case "session":
			result = sessionHandler(STATE);
			return result;

		case "status":
			result = statusHandler(STATE);
			return result;

		case "notification":
			result = notificationHandler(request.subCommand, request.options, STATE);
			return result;

		case "help":
			result = helpHandler();
			return result;

		default:
			throw new Error(`Unknown Command: ${request.command}`);
	}
}
