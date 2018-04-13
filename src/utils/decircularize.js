/**
	Simplifies an object by removing circular pointers,
	and also recognizing redundant object properties.
	@arg {Object} rootObject
	@return a copy of the object with circularities removed
*/
function decircularize(rootObject) {
	var globalReferences = [];
	function copy(object) {
		globalReferences.push(object);
		var localReferences = [];
		var copyObject = Object.assign({}, object);
		for (var key in object) {
			if (typeof(object[key]) === 'object') {
				if (localReferences.includes(object[key])) {
					copyObject[key] = '[Redundant]';
				}else if (globalReferences.includes(object[key])) {
					copyObject[key] = '[Circular]';
				} else {
					localReferences.push(object[key]);
					copyObject[key] = copy(object[key]);
				}
			}
		}
		return copyObject;
	}
	return copy(rootObject);
}

module.exports = {decircularize};
