const REGEX = '(\\d+)[\\s\\-]?°?(\\w+)\\.?';

const F = 9/5;
const C = 1/F;
const CM = 2.54; 
const IN = 1/CM;
const FT = 12;
const M = 100;
const MI = 5280;
const KM = 1000;
const L = 3.78541;
const GAL = 1/L;

const CONVERSION_TABLE = {
	'f': function (c) {
		return 32 + c * F;
	},
	'c': function (f) {
		return (f - 32) * C;
	},
	'in': function (cm) {
		return cm * IN;
	},
	'cm': function (inches) {
		return inches * CM;
	},
	'ft': function (m) {
		return (m * M) * (IN / FT);
	},
	'm': function (ft) {
		return (ft * FT) * (CM / M);
	},
	'mi': function (km) {
		return (km * KM * M) * (IN / FT / MI);
	},
	'km': function (mi) {
		return (mi * MI * FT) * (CM / M / KM);
	},
	'gal': function (l) {
		return l * GAL;
	},
	'L': function (gal) {
		return gal * L;
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
		for (let item of message.match(new RegExp(REGEX,'g'))) {
			var [,value,unit] = item.match(new RegExp(REGEX)));
			value = Number(value);
			unit = unit.toLowerCase();
			switch (unit) {
				case 'f':
				case 'fahrenheit':
					this.data.conversions.push({from:'f',to:'c',value});
					break;
				case 'c':
				case 'celsius':
					this.data.conversions.push({from:'c',to:'f',value});
					break;
				case 'in':
				case 'inch':
				case 'inches':
					this.data.conversions.push({from:'in',to:'cm',value});
					break;
				case 'cm':
				case 'centimeter':
				case 'centimeters':
					this.data.conversions.push({from:'cm',to:'in',value});
					break;
				case 'ft':
				case 'foot':
				case 'feet':
					this.data.conversions.push({from:'ft',to:'m',value});
					break;
				case 'm':
				case 'meter':
				case 'meters':
					this.data.conversions.push({from:'m',to:'ft',value});
					break;
				case 'mi':
				case 'mile':
				case 'miles':
					this.data.conversions.push({from:'mi',to:'km',value});
					break;
				case 'km':
				case 'kilometer':
				case 'kilometers':
					this.data.conversions.push({from:'km',to:'mi',value});
					break;
				case 'gal':
				case 'gallon':
				case 'gallons':
					this.data.conversions.push({from:'gal',to:'L',value});
					break
				case 'l':
				case 'liter':
				case 'litre':
				case 'liters':
				case 'litres':
					this.data.conversions.push({from:'L',to:'gal',value});
					break;
			}
		}
		if (this.data.conversions.length > 0) {
			return 'convert';
		}
	},
	events: {
		convert() {
			return this.data.conversions.map(function ({from,to,value}) {
				return `${value} ${from} ≈ ${CONVERSION_TABLE[from](value)} ${to}`;
			}).join('\n');
		}
	}
};
