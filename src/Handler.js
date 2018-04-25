const {Markdown:md} = require('./Utils');

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
		
		this.response = {
			message:  '',
			embed:    null,
			filename: '',
			file:     null,
			expires:  false
		};
		
		Object.assign(this, context, input);
	}
	set title(x) {
		if (typeof(x) === 'string' && x.length > 0) {
			if (this.response.embed) {
				if (this.response.embed.title) {
					this.response.embed.title = x + ' | ' + this.response.embed.title;
				} else {
					this.response.embed.title = x;
				}
			} else {
				if (this.response.message) {
					this.response.message = md.bold(x) + ' | ' + this.response.message;
				} else {
					//this.response.message = md.bold(x);
				}
			}
		}
	}
	resolve(x) {
		if (typeof(x) !== 'undefined') {
			if (typeof(x) === 'string') {
				this.response.message = x;
			} else if (typeof(x) === 'object') {
				if (x.constructor.name == 'Promise') {
					return x.then(y => this.resolve(y));
				} else if (x.message || x.embed || x.file) {
					this.response = x;
				} else if (x.title || x.description || x.fields) {
					this.response.embed = x;
				} else if (x instanceof Array) {
					return this.resolve(x[Math.floor(x.length * Math.random())]);
				} else {
					throw 'Invalid object keys: ' + Object.keys(x).join(', ');
				}
			} else {
				this.response.message = String(x);
			}
		}
		return Promise.resolve(this);
	}
	reject(x) {
		if (x instanceof Promise) {
			return x.then(y => this.reject(y));
		}
		if (typeof(x) !== 'undefined') {
			this.error = x;
			this.response.message = ':warning: **Error**: ' + x;
			this.response.expires = true;
		}
		return Promise.resolve(this);
	}
}

module.exports = Handler;
