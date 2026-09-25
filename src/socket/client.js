import net from "net";
import { encodeMessage, decodeMessage } from "./protocol.js";
import { parser } from "./cliParser.js";

const SOCKET_PATH = "test.sock";

const client = net.createConnection(SOCKET_PATH, () => {
});

let input = process.argv.slice(2).join(" ");

if (input.trim() === "") {
	input = "--help";
}

const request = parser(input);
client.write(encodeMessage(request));

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
