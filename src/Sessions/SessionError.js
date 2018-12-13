
class SessionError extends Error {
	constructor(id, str) {
		super(`${str} (in "${id}")`);
		this.name = 'SessionError';
	}
}

module.exports = SessionError;
