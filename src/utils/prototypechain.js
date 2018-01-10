function PrototypeChain(obj) {
	var chain = [];
	while (obj != null) {
		switch (typeof(obj)) {
			case 'function':
				chain.push(obj.name);
				break;
			case 'object':
				chain.push(obj.constructor.name);
				break;
			default:
				chain.push(typeof(obj));
		}
		obj = Object.getPrototypeOf(obj);
	}
	chain.push('null');
	return chain;
}

module.exports = {PrototypeChain};