import net from "net";
import readline from "readline";
import { encodeMessage, decodeMessage } from "./protocol.js";
import { parser } from "./cliParser.js";

const SOCKET_PATH = "test.sock";

const client = net.createConnection(SOCKET_PATH, () => {
	console.log("connecting to the net limiter server");
});

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
	prompt: "netlimiter > "
});

client.on("connect", () => {
	console.log("Connected to net limiter server");
	rl.prompt();
});

rl.on("line", (input) => {
	if (input.trim === "") {
		rl.prompt();
		return;
	}

	const request = parser(input);
	client.write(encodeMessage(request));
});

let buffer = "";
client.on("data", (data) => {
	buffer += data.toString();

	let newLineIndex;
	while ((newLineIndex = buffer.indexOf("\n")) !== -1) {
		const message = buffer.slice(0, newLineIndex);
		buffer = buffer.slice(newLineIndex + 1);

		if (message.length === 0) continue;

		const response = decodeMessage(message);
		console.log("netlimiter > response -", response);
		rl.prompt();
	}
})

client.on("close", () => {
	console.log("close event: Disconnected from server");
	rl.close();
	process.exit(0);
});

client.on("end", () => {
	console.log("end event: connection closed");
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
