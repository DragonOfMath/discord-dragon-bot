function PrototypeChain(obj) {
	var chain = [];
	while (obj != null) {
		chain.push(obj.name||typeof(obj));
		obj = Object.getPrototypeOf(obj);
	}
	chain.push('null');
	console.log(chain.join('>'));
}

module.exports = {PrototypeChain};