/**
 * @class BankError
 * @extends Error
 */
class BankError extends Error {
	constructor(message) {
		super(message);
		this.name = 'BankError';
	}
}

module.exports = BankError;
