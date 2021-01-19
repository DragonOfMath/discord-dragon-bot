const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR   = 60 * MINUTE;
const DAY    = 24 * HOUR;

const OPEN = 'open';
const BUSY = 'busy';
const CLOSED = 'closed';
const DEAD = 'dead';

const DEFAULT_AMOUNT = 1000;
const RATE = 0.05;
const COMPOUNDING = 1;

module.exports = {
	HEADER: ':dragon::bank:Dragon Bank:tm:',
	CURRENCY: ':dragon:$',
	ROUNDING: 1,
	Account:{
		DEFAULT_AMOUNT,
		STATE: {
			OPEN,
			BUSY,
			CLOSED,
			DEAD
		},
		DAILY: {
			AMOUNT: 500,
			WAIT: 1 * DAY
		},
		TEMPLATE: {
			state: OPEN,
			credits: DEFAULT_AMOUNT,
			authorized: false,
			investments: []
		}
	},
	Investment: {
		RATE,
		COMPOUNDING,
		FEE: 250,
		MINIMUM: 1000,
		WAIT: 1 * HOUR,
		TIME_SCALE: 1 * DAY,
		TEMPLATE: {
			principle: 0,
			rate: RATE,
			compounding: COMPOUNDING,
			started: (s) => (s || Date.now())
		}
	}
};
