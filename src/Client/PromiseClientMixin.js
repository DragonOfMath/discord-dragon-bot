const Promise = require('bluebird'); // overrides native Promise; needed for Promise.delay()
const {METHODS} = require('../Constants/Client');

/**
	@class PromiseClient
	@extends Client
	Wraps all promisifiable methods (from Discord.Client).
	This will be the base for all other Client extensions.
*/
module.exports = (Client) => {
	class PromiseClient extends Client {
		constructor() {
			super(...arguments);
			//this._requestBucket = [];
		}
		
		get messages() {
			return this._messageCache;
		}
		get userDMs() {
			return this._uIDToDM;
		}
		
		/* Utility methods */
		async wait(time, event, ...args) {
			await Promise.delay(time);
			if (typeof(event) === 'function') {
				return event.apply(this, args);
			}
		}
		interval(time, event, ...args) {
			let client = this;
			return (function tick() {
				return client.wait(time, event, ...args)
				.then(x => x && tick());
			})();
		}
		
		/**
			Creates a Promise that calls the equivalent method in the superclass
			1.6.3+: Intercepts the response, and if the client is being rate-limited,
			it will retry the request at a later time.
		*/
		async await(method, payload) {
			// Resolve a channel ID if there is one
			if (payload.to) {
				payload.to = await this.resolveChannel(payload.to);
			} else if (payload.channelID) {
				payload.channelID = await this.resolveChannel(payload.channelID);
			}
			
			return new Promise((resolve, reject) => {
				return super[method](payload, (error, response) => {
					return error ? reject(error) : resolve(response);
				});
			})
			.catch(async e => {
				// intercept response errors
				if (e.name && e.name == 'ResponseError') {
					// https://discordapp.com/developers/docs/topics/opcodes-and-status-codes
					//console.log(e);
					switch (e.statusCode) {
						case 429: // TOO MANY REQUESTS
							// handle rate-limiting
							let retry_after = e.response.retry_after + 100;
							console.log('Retrying',method,'after',retry_after,'ms');
							await this.wait(retry_after);
							return this.await(method, payload);
						case 400: // BAD REQUEST
						case 401: // UNAUTHORIZED
						case 403: // FORBIDDEN
						case 404: // NOT FOUND
						case 405: // METHOD NOT ALLOWED
							console.log(`${e.statusMessage} with ${method}`);
							console.log('Payload:', JSON.stringify(payload));
						default:
							throw e;
					}
				}
				return e;
			});
		}
		
		/**
		 * Returns the normalized channel ID from either a Guild Channel or User (DM).
		 * Creates a DM channel if one is not cached.
		 * @param {Snowflake|User|Channel} channel
		 * @return the Snowflake ID of the Guild/DM channel
		 */
		async resolveChannel(channel) {
			channel = channel.id || channel;
			if (channel in this.channels) {
				return channel;
			} else if (channel in this.directMessages) {
				return channel;
			} else if (channel in this.users) {
				if (!(channel in this.userDMs)) {
					await this.createDMChannel(channel);
				}
				return this.userDMs[channel];
			} else {
				throw new Error('Invalid channel or user ID: ' + channel);
			}
		}
	}
	
	METHODS.forEach(method => {
		PromiseClient.prototype[method] = function (payload) {
			return this.await(method, payload);
		};
	});
	
	return PromiseClient;
};
