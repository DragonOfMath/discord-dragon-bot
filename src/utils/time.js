const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR   = 60 * MINUTE;
const DAY    = 24 * HOUR;
const WEEK   = 7  * DAY;
const MONTH  = 30 * DAY;
const YEAR   = 12 * MONTH;

function parseTime(tokens, time = 0) {
	for (var i = 0, n; i < tokens.length; ++i) {
		n = Number(tokens[i]);
		if (isFinite(n)) {
			switch (tokens[++i].toLowerCase()) {
				case 's':
				case 'sec':
				case 'secs':
				case 'second':
				case 'seconds':
					time += n * SECOND;
					break;
				case 'm':
				case 'min':
				case 'mins':
				case 'minute':
				case 'minutes':
					time += n * MINUTE;
					break;
				case 'h':
				case 'hr':
				case 'hrs':
				case 'hour':
				case 'hours':
					time += n * HOUR;
					break;
				case 'd':
				case 'day':
				case 'days':
					time += n * DAY;
					break;
				case 'w':
				case 'wk':
				case 'wks':
				case 'week':
				case 'weeks':
					time += n * WEEK;
					break;
				case 'mo':
				case 'mos':
				case 'month':
				case 'months':
					time += n * MONTH;
					break;
				case 'y':
				case 'yr':
				case 'yrs':
				case 'year':
				case 'years':
					time += n * YEAR;
					break;
				default:
					time += n * SECOND;
					break;
			}
		} else {
			args.splice(0, i);
			break;
		}
	}
	return Math.round(time);
}

module.exports = {parseTime};