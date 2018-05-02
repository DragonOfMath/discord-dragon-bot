const {Markdown:md,random} = require('./Utils');

class Response {
	constructor() {
		this.message  = '';
		this.embed    = null;
		this.filename = '';
		this.file     = null;
		this.expires  = false;
	}
	set title(x) {
		if (typeof(x) === 'string' && x.length > 0) {
			if (this.embed) {
				if (this.embed.title) {
					this.embed.title = x + ' | ' + this.embed.title;
				} else {
					this.embed.title = x;
				}
			} else {
				if (this.message) {
					this.message = md.bold(x) + ' | ' + this.message;
				} else {
					//this.message = md.bold(x);
				}
			}
		}
	}
}

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
	resolve(x) {
		if (typeof(x) !== 'undefined') {
			if (typeof(x) === 'string') {
				this.response.message = x;
			} else if (typeof(x) === 'object') {
				if (x.constructor.name == 'Promise') {
					return x.then(y => this.resolve(y));
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
