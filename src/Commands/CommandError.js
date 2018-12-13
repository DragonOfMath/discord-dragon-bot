/**
 * @class CommandError
 * @extends Error
 * Custom error object for commands.
 */
class CommandError extends Error {
	constructor(cmd, str) {
		super(`${str} (in "${cmd}")`);
		this.name = 'CommandError';
	}
}

module.exports = CommandError;
