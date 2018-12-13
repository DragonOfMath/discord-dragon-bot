/**
 * @class DatabaseError
 * @extends Error
 */
class DatabaseError extends Error {
	constructor(message) {
		super(message);
		this.name = 'DatabaseError';
	}
}

module.exports = DatabaseError;
