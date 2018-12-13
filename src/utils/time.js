const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR   = 60 * MINUTE;
const DAY    = 24 * HOUR;
const WEEK   = 7  * DAY;
const MONTH  = 30 * DAY;
const YEAR   = 12 * MONTH;

/**
	Timezone offsets by abbreviation
	Some timezone abbreviations have ambigious meaning, so don't use this for official stuff
*/
Date.Timezones = {
	UTC:  '+00:00', // Coordinated Universal Time
	GMT:  '+00:00', // Greenwich Mean Time
	
	WET:  '+00:00', // Western European Time
	AZOST:'+00:00', // Azores Summer Time
	EGST: '+00:00', // Eastern Greenland Summer Time
	BST:  '+01:00', // British Summer/Standard Time
	CET:  '+01:00', // Central European Time
	DFT:  '+01:00', // AIX-specific equivalent of CET
	IST:  '+01:00', // Irish Standard Time
	MET:  '+01:00', // Middle European Time
	WAT:  '+01:00', // West Africa Time
	WEST: '+01:00', // Western European Summer Time
	CAT:  '+02:00', // Central Africa Time
	CEST: '+02:00', // Central European Summer Time
	EET:  '+02:00', // Eastern European Time
	HAEC: '+02:00', // French equivalent of CEST
	IST:  '+02:00', // Israel Standard Time
	KALT: '+02:00', // Kaliningrad Time
	MEST: '+02:00', // Middle European Standard Time
	SAST: '+02:00', // South African Standard Time
	WAST: '+02:00', // West Africa Summer Time
	AST:  '+03:00', // Arabia Standard Time
	EAT:  '+03:00', // East Africa Time
	EEST: '+03:00', // Eastern European Standard Time
	FET:  '+03:00', // Further-eastern European Time
	IDT:  '+03:00', // Israel Daylight Time
	MSK:  '+03:00', // Moscow Time
	SYOT: '+03:00', // Showa Station Time
	TRT:  '+03:00', // Turkey Time
	IRST: '+03:30', // Iran Standard Time
	AMT:  '+04:00', // Armenia Time
	AZT:  '+04:00', // Azerbaijan Time
	GET:  '+04:00', // Georgia Standard Time
	GST:  '+04:00', // Gulf Standard Time
	MUT:  '+04:00', // Mauritius Time
	RET:  '+04:00', // Réunion Time
	SAMT: '+04:00', // Samara Time
	SCT:  '+04:00', // Seychelles Time
	VOLT: '+04:00', // Volgograd Time
	AFT:  '+04:30', // Afghanistan Time
	IRDT: '+04:30', // Iran Daylight Time
	HMT:  '+05:00', // Heart and McDonald Islands Time
	MAWT: '+05:00', // Mawson Station Time
	MVT:  '+05:00', // Maldives Time
	ORAT: '+05:00', // Oral Time
	PKT:  '+05:00', // Pakistan Standard Time
	TFT:  '+05:00', // Indian/Kerguelen
	TJT:  '+05:00', // Tajikistan Time
	TMT:  '+05:00', // Turkmenistan Time
	UZT:  '+05:00', // Uzbekistan Time
	YEKT: '+05:00', // Yekaterinburg Time
	IST:  '+05:30', // Indian Standard Time
	SLST: '+05:30', // Sri Lanka Standard Time
	NPT:  '+05:45', // Nepal Time
	BIOT: '+06:00', // British Indian Ocean Time
	//BST:  '+06:00', // Bangladesh Standard Time (conflict with British Standard Time/Bourgainville Standard Time)
	BTT:  '+06:00', // Bhutan Time
	KGT:  '+06:00', // Kyrgyzstan Time
	OMST: '+06:00', // Omsk Time
	VOST: '+06:00', // Vostok Station Time
	CCT:  '+06:30', // Cocos Islands Time
	MMT:  '+06:30', // Myanmar Standard Time
	ACT:  '+06:30', // ASEAN Standard Time
	CXT:  '+07:00', // Christmas Island Time
	DAVT: '+07:00', // Davis Time
	HOVT: '+07:00', // Khovd Standard Time
	ICT:  '+07:00', // Indochina Time
	KRAT: '+07:00', // Krasnoyarsk Time
	THA:  '+07:00', // Thailand Standard Time
	WIT:  '+07:00', // Western Indonesian Time
	AWST: '+08:00', // Australian Western Standard Time
	BDT:  '+08:00', // Brunei Time
	CHOT: '+08:00', // Choibalsan Standard Time
	CIT:  '+08:00', // Central Indonesia Time
	CST:  '+08:00', // China Standard Time (Conflict with Cuba Standard Time/Central Standard Time)
	CT:   '+08:00', // China Time
	HKT:  '+08:00', // Hong Kong Time
	HOVST:'+08:00', // Khovd Summer Time
	IRKT: '+08:00', // Irkutsk Time
	MST:  '+08:00', // Malaysia Standard Time
	MYT:  '+08:00', // Malaysia Time
	PHT:  '+08:00', // Philippine Time
	//PST:  '+08:00', // Philippine Standard Time (conflict with Pacific Standard Time)
	SGT:  '+08:00', // Singapore Time
	SST:  '+08:00', // Singapore Standard Time
	ULAT: '+08:00', // Ulaanbaatar Standard Time
	WST:  '+08:00', // Western Standard Time
	ACWST:'+08:45', // Australian Central Western Standard Time
	CWST: '+08:45', // Central Western Standard Time (Australia)
	CHOST:'+09:00', // Choibalsan Summer Time
	EIT:  '+09:00', // Eastern Indonesian Time
	JST:  '+09:00', // Japan Standard Time
	KST:  '+09:00', // Korea Standard Time
	TLT:  '+09:00', // Timor Leste Time
	ULAST:'+09:00', // Ulaanbaatar Summer Time
	YAKT: '+09:00', // Yakutsk Time
	ACST: '+09:30', // Australian Central Standard Time
	AEST: '+10:00', // Australian Eastern Standard Time
	CHST: '+10:00', // Chuuk Time
	DDUT: '+10:00', // Dumont d'Urville Time
	PGT:  '+10:00', // Papua New Guinea Time
	VLAT: '+10:00', // Vladivostok Time
	ACDT: '+10:30', // Australian Central Daylight Savings Time
	LHST: '+10:30', // Lord Howe Standard Time
	AEDT: '+11:00', // Australian Eastern Daylight Savings Time
	//BST:  '+11:00', // Bourgainville Standard Time (conflict with British/Bangladesh Standard Time)
	KOST: '+11:00', // Kosrae Time
	LHST: '+11:00', // Lord Howe Summer Time
	MIST: '+11:00', // Macquarie Island Station Time
	NCT:  '+11:00', // New Caledonia Time
	NFT:  '+11:00', // Norfolk Island Time
	PONT: '+11:00', // Pohnpei Standard Time
	SAKT: '+11:00', // Sakhalin Island Time
	SBT:  '+11:00', // Solomon Islands Time
	SRET: '+11:00', // Srednekolymsk Time
	VUT:  '+11:00', // Vanuatu Time
	FJT:  '+12:00', // Fiji Time
	GILT: '+12:00', // Gilbert Island Time
	MAGT: '+12:00', // Magadan Time
	MHT:  '+12:00', // Marshall Islands Time
	NZST: '+12:00', // New Zealand Standard Time
	PETT: '+12:00', // Kamchatka Time
	TVT:  '+12:00', // Tuvalu Time
	WAKT: '+12:00', // Wake Island Time
	//IDLE: '+12:00', // International Day Line East
	CHAST:'+12:45', // Chatham Standard Time
	NZDT: '+13:00', // New Zealand Daylight Time
	PHOT: '+13:00', // Phoenix Island Time
	TKT:  '+13:00', // Tokelau Time
	TOT:  '+13:00', // Tonga Time
	CHADT:'+13:45', // Chatham Daylight Time
	LINT: '+14:00', // Line Islands Time
	
	AZOT: '-01:00', // Azores Standard Time
	CVT:  '-01:00', // Cape Verde Time
	EGT:  '-01:00', // Eastern Greenland Time
	BRST: '-02:00', // Brazil Summer Time
	FNT:  '-02:00', // Fernando de Noronha Time
	GST:  '-02:00', // South Georgia & South Sandwich Islands Time
	PMDT: '-02:00', // Saint Pierre & Miquelon Daylight Time
	UYST: '-02:00', // Uruguay Summer Time
	NDT:  '-02:30', // Newfoundland Daylight Time
	ADT:  '-03:00', // Atlantic Daylight Time
	AMST: '-03:00', // Amazon Summer Time (Brazil)
	ART:  '-03:00', // Argentina Time
	BRT:  '-03:00', // Brasilia Time
	CLST: '-03:00', // Chile Summer Time
	FKST: '-03:00', // Falkland Islands Summer Time
	GFT:  '-03:00', // French Guiana Time
	PMST: '-03:00', // Saint Pierre & Miquelon Standard Time
	PYST: '-03:00', // Paraguay Summer Time
	ROTT: '-03:00', // Rothera Research Station Time
	SRT:  '-03:00', // Suriname Time
	UYT:  '-03:00', // Uruguay Standard Time
	NST:  '-03:30', // Newfoundland Standard Time
	NT:   '-03:30', // Newfoundland Time (same as NST)
	AMT:  '-04:00', // Amazon Time (Brazil)
	AST:  '-04:00', // Atlantic Standard Time
	BOT:  '-04:00', // Bolivia Time
	//CDT:  '-04:00', // Cuba Daylight Time (conflict with Central Daylight Time)
	CLT:  '-04:00', // Chile Standard Time
	COST: '-04:00', // Colombia Summer Time
	ECT:  '-04:00', // Eastern Carribean Time
	EDT:  '-04:00', // Eastern Daylight Time (North America)
	FKT:  '-04:00', // Falkland Islands Time
	GYT:  '-04:00', // Guyana Time
	PYT:  '-04:00', // Paraguay Time
	VET:  '-04:00', // Venezuelan Standard Time
	ACT:  '-05:00', // Acre Time
	CDT:  '-05:00', // Central Daylight Time (conflict with Cuba Daylight Time)
	COT:  '-05:00', // Colombia Time
	//CST:  '-05:00', // Cuba Standard Time (conflict with Central Standard Time/China Standard Time)
	EASST:'-05:00', // Easter Island Summer Time
	ECT:  '-05:00', // Ecuador Time
	EST:  '-05:00', // Eastern Standard Time (North America)
	PET:  '-05:00', // Peru Time
	CST:  '-06:00', // Central Standard Time
	EAST: '-06:00', // Easter Island Standard Time
	GALT: '-06:00', // Galapagos Time
	MDT:  '-06:00', // Mountain Daylight Time (North America)
	MST:  '-07:00', // Mountain Standard Time (North America)
	PDT:  '-07:00', // Pacific Daylight Time (North America)
	AKDT: '-08:00', // Alaska Daylight Time
	CIST: '-08:00', // Clipperton Island Standard Time
	PST:  '-08:00', // Pacific Standard Time (conflict with Philippine Standard Time)
	AKST: '-09:00', // Alaska Standard Time
	GAMT: '-09:00', // Gambier Islands Time
	GIT:  '-09:00', // Gambier Island Time
	HDT:  '-09:00', // Hawaii-Aleutian Daylight Time
	MART: '-09:30', // Markquesas Islands Time
	MIT:  '-09:30', // Markquesas Islands Time
	CKT:  '-10:00', // Cook Island Time
	HST:  '-10:00', // Hawaii-Aleutian Standard Time
	SDT:  '-10:00', // Samoa Daylight Time
	TAHT: '-10:00', // Tahiti Time
	NUT:  '-11:00', // Niue Time
	SST:  '-11:00', // Samoa Standard Time
	BIT:  '-12:00', // Baker Island Time
	IDLW: '-12:00'  // International Day Line West
};

Date.parseDuration = function (tokens, time = 0) {
	if (typeof tokens === 'string') {
		tokens = [tokens];
	}
	if (tokens.length == 1) {
		let t = tokens[0];
		let sign = t[0];
		if (sign == '+' || sign == '-') {
			t = t.substring(1);
			sign = Number(sign+'1');
		} else {
			sign = 1;
		}
		let [h,m,s] = t.split(/:/);
		if (!m) {
			time += sign * (h * SECOND);
		} else if (!s) {
			time += sign * ((h * MINUTE) + (m * SECOND));
		} else {
			time += sign * ((h * HOUR) + (m * MINUTE) + (s * SECOND));
		}
		return time;
	}
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
			tokens.splice(0, i);
			break;
		}
	}
	return Math.round(time);
};

/**
	Get the timezone offset using one of the timezone codes
*/
Date.getTimezoneOffset = function (timezone) {
	// get offset as +/-HH:MM from GMT
	let tzoff = Date.Timezones[timezone];
	if (!tzoff) return NaN;
	// multiply by 60 to go from MM:SS to HH:MM
	return Date.parseDuration(tzoff) * 60;
};

/**
	
*/
Date.getTimezoneDifference = function (tz1, tz2) {
  return Date.getTimezoneOffset(tz2) - Date.getTimezoneOffset(tz1);
};

/**
	Get the current time in the specified timezone using the abbreviation or IANA region code
*/
Date.getTimezoneTimeString = function (timezone, time = Date.now()) {
	let now = new Date(time);
	try {
		return now.toLocaleTimeString('en-US', {timeZone: timezone});
	} catch (e) {
		// get the UTC time in milliseconds (this is exactly the same as Date.now())
		let utcms = now.getTime();
		
		// get the timezone offset in minutes, then convert to milliseconds
		// Note: the sign is flipped
		let myoffset = -now.getTimezoneOffset() * MINUTE;
		
		// get the offset of the target timezone in milliseconds
		let tzoffset = Date.getTimezoneOffset(timezone);
		if (!tzoffset) {
			throw 'Invalid timezone or IANA region code.';
		}
		
		// add the offsets to the time and return a new time string
		return new Date(utcms + (tzoffset - myoffset)).toLocaleTimeString('en-US');
	}
};

/**
	
*/
Date.prototype.difference = function (date = 0) {
	return this.getTime() - (date instanceof Date ? date.getTime() : date);
};

module.exports = {Date};
