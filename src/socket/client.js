import net from "net";
import { encodeMessage, decodeMessage, parseMessages } from "./protocol.js";
import { cliParser } from "../cli/cliParser.js";

const SOCKET_PATH = "test.sock";

const client = net.createConnection(SOCKET_PATH, () => {
});

let input = process.argv.slice(2).join(" ");

if (input.trim() === "") {
	input = "help";
}

const request = cliParser(input);
client.write(encodeMessage(request));

let buffer = "";
client.on("data", (data) => {
	const result = parseMessages(buffer, data);
	buffer = result.buffer;

	for (const message of result.messages) {

		const response = decodeMessage(message);
		console.log("netlimiter > response -", response);

		client.end();
	}
})

client.on("close", () => {
	//	console.log("close event: Disconnected from server");
	process.exit(0);
});

client.on("end", () => {
	//	console.log("end event: connection closed");
});

client.on("error", (err) => {
	console.error("socket error -", err.message);
});

process.on("SIGINT", () => {
	client.end();
});

process.on("SIGTERM", () => {
	client.end();
});
