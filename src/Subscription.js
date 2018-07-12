const Resource = require('./Resource');
const {fetch,unescapeHTMLEntities} = require('./Utils');
const Constants = require('./Constants').Subscription;

class Subscription extends Resource {
	constructor(data = {}) {
		super(Constants.TEMPLATE, data);
	}
	
}