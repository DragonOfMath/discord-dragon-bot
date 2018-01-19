const MATCH_STRING = '([\\d\\.\\-]+)[\\s\\-]?°?(\\w+)(\\/\\w+)*';
const ALL_REGEX = new RegExp(MATCH_STRING,'g');
const ONE_REGEX = new RegExp(MATCH_STRING);

const F = 9/5;
const C = 5/9;
const CM = 2.54; 
const IN = 1/CM;
const IN_PER_FT = 12;
const CM_PER_M = 100;
const FT_PER_MI = 5280;
const M_PER_KM = 1000;
const GAL = 3.78541;
const L = 1/GAL;

const CONVERSION_TABLE = {
	// Fahrenheit -> Celsius
	'F': function (x) {
		return (x - 32) * C;
	},
	// Celsius -> Fahrenheit
	'C': function (x) {
		return x * F + 32;
	},
	// Inches -> Centimeters
	'in': function (x) {
		return x * CM;
	},
	// Centimeters -> Inches
	'cm': function (x) {
		return x * IN;
	},
	// Feet -> Meters
	'ft': function (x) {
		return this['in'](x * IN_PER_FT) / CM_PER_M;
	},
	// Meters -> Feet
	'm': function (x) {
		return this['cm'](x * CM_PER_M) / IN_PER_FT;
	},
	// Miles -> Kilometers
	'mi': function (x) {
		return this['ft'](x * FT_PER_MI) / M_PER_KM;
	},
	// Kilometers -> Miles
	'km': function (x) {
		return this['m'](x * M_PER_KM) / FT_PER_MI;
	},
	// Gallons -> Liters
	'gal': function (x) {
		return x * GAL;
	},
	// Liters -> Gallons
	'L': function (x) {
		return x * L;
	}
};

module.exports = {
	id: 'si-conversion',
	info: 'Converts Imperial system measurements to SI units and vice versa.',
	settings: {
		expires: null,
		reset:   false,
		max:     -1,
		cancel:  -1,
		silent: true
	},
	data: {
		conversions: []
	},
	permissions: {
		type: 'public'
	},
	resolver({client, message, userID, channelID}) {
		this.data.conversions = [];
		var matches = message.match(ALL_REGEX);
		if (!matches) {
			return;
		}
		for (let item of matches) {
			var [,value,unit,rate=''] = item.match(ONE_REGEX);
			value = Number(value);
			if (isNaN(value)) {
				continue;
			}
			unit = unit.toLowerCase();
			rate = rate.toLowerCase();
			switch (unit) {
				case 'f':
				case 'fahrenheit':
					this.data.conversions.push({from:'F',to:'C',value,rate});
					break;
				case 'c':
				case 'celsius':
					this.data.conversions.push({from:'C',to:'F',value,rate});
					break;
				case 'in':
				case 'inch':
				case 'inches':
					this.data.conversions.push({from:'in',to:'cm',value,rate});
					break;
				case 'cm':
				case 'centimeter':
				case 'centimeters':
					this.data.conversions.push({from:'cm',to:'in',value,rate});
					break;
				case 'ft':
				case 'foot':
				case 'feet':
					this.data.conversions.push({from:'ft',to:'m',value,rate});
					break;
				case 'm':
				case 'meter':
				case 'meters':
					this.data.conversions.push({from:'m',to:'ft',value,rate});
					break;
				case 'mi':
				case 'mile':
				case 'miles':
					this.data.conversions.push({from:'mi',to:'km',value,rate});
					break;
				case 'km':
				case 'kilometer':
				case 'kilometers':
					this.data.conversions.push({from:'km',to:'mi',value,rate});
					break;
				case 'gal':
				case 'gallon':
				case 'gallons':
					this.data.conversions.push({from:'gal',to:'L',value,rate});
					break
				case 'l':
				case 'liter':
				case 'litre':
				case 'liters':
				case 'litres':
					this.data.conversions.push({from:'L',to:'gal',value,rate});
					break;
			}
		}
		if (this.data.conversions.length > 0) {
			return 'convert';
		}
	},
	events: {
		convert() {
			return this.data.conversions.map(function ({from,to,value,rate}) {
				return `${value} ${from}${rate} ≈ ${CONVERSION_TABLE[from](value).toFixed(2)} ${to}${rate}`;
			}).join('\n');
		}
	}
};
