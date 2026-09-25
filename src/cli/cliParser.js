export function cliParser(input = "") {

	const tokens = input.trim().split(/\s+/);

	const command = tokens[0];
	const remaining = tokens.slice(1);

	if (command === "speed") {
		if (remaining[0] === "--watch") {
			return {
				command,												// have to modify the parsing logic later for integrating "--watch" in the defind categories 
				options: {
					watch: true
				}
			}
		}
	}

	const commandWithSubCommands = ["limit", "notification"];
	let subCommand;
	let optionTokens;

	if (commandWithSubCommands.includes(command)) {
		subCommand = remaining[0];
		optionTokens = remaining.slice(1);
	} else {
		optionTokens = remaining;
	}

	let options = {};

	for (let i = 0; i < optionTokens.length; i += 2) {
		let key = optionTokens[i].slice(2);
		let value = optionTokens[i + 1];
		if (!Number.isNaN(Number(value))) {
			value = Number(value);
		}

		options[key] = value;
	}

	return {
		command,
		subCommand,
		options
	}
}

/*
console.log(tokenize("usage --days 30"));
console.log(tokenize("usage --days 2"));
console.log(tokenize("usage --from 2026-09-01 --to 2026-09-18"));
console.log(tokenize("usage --days 350"));
console.log(tokenize("interface --days 30"));
console.log(tokenize("interface --from 2026-09-01 --to 2026-09-19"));
console.log(tokenize("speed"));
console.log(tokenize("session"));
console.log(tokenize("status"));
console.log(tokenize("help"));
console.log(tokenize("notification disable --threshold 2"));
console.log(tokenize("notification enable"));
console.log(tokenize("limit get"));
console.log(tokenize("limit set --days 30 --amount 1"));
console.log(tokenize("limit get"));
*/
