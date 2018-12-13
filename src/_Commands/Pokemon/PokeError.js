class PokeError extends Error {
	constructor(msg) {
		super(msg);
		this.name = 'PokéError';
	}
}

module.exports = PokeError;
