const Response = require('./Response');
const {Markdown:md,random} = require('../Utils');

const ERROR = '⚠';

class Handler {
	constructor(context, input) {
		if (typeof(context) !== 'object') {
			throw 'Context is invalid or missing.';
		}
		if (typeof(input) !== 'object') {
			throw `Input not runnable: ${input} (${typeof input})`;
		}
		
		this.context  = context;
		this.input    = input;
		this.grant    = null;
		this.error    = null;
		this.response = new Response();
		
		Object.assign(this, context, input);
	}
	set title(x) {
		this.response.title = x;
	}
	async resolve(x) {
		x = await x;
		if (typeof(x) !== 'undefined') {
			if (typeof(x) === 'string') {
				this.response.message = x;
			} else if (typeof(x) === 'object') {
				if (x.constructor.name === 'Handler') {
					// skip
				} else if (x.message || x.embed || x.file) {
					this.response = x;
				} else if (x.title || x.description || x.fields || x.color || x.image || x.video) {
					this.response.embed = x;
				} else if (x instanceof Array) {
					return this.resolve(random(x));
				} else {
					throw 'Invalid object keys: ' + Object.keys(x).join(', ');
				}
			} else {
				this.response.message = String(x);
			}
		}
		return this;
	}
	async reject(x) {
		x = await x;
		if (typeof(x) !== 'undefined') {
			this.error = x;
			if (x instanceof Error) {
				this.response.message = `${ERROR} ${md.bold(x.name)}: ${md.code(x.message)}`;
			} else {
				this.response.message = `${ERROR} ${md.bold('Error')}: ${x}`;
			}
			this.response.expires = true;
		}
		return this;
	}
	async sendErrorReport(error) {
		let errorMessage = 'Error:\n' + md.codeblock(error.toString())
			+ '\nContext:\n' + md.codeblock(this.context.debug())
			+ (error.stack ? '\nStack Trace:\n' + md.codeblock(error.stack) : '');
		return this.send(this.client.ownerID, errorMessage);
	}
}

module.exports = Handler;
