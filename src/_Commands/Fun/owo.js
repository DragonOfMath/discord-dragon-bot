const {random} = require('../../Utils');

const OwO = ['(・`ω´・)','(´・ω・`)',';;w;;','OwO','owo','UwU','uwu','>w<','^w^','x3','X3',':3'];

/*
	owoify from https://github.com/MalHT/hewwobot/blob/master/bot.js
	Additional tidbits from https://github.com/Printendo/HewwoStudio
*/
module.exports = function owoify(x) {
	function isUpper(x) {
		return x.toUpperCase() == x;
	}
	function isLower(x) {
		return x.toLowerCase() == x;
	}
	function replaceWith(str, rep) {
		for (var i = 0; i < rep.length; i++) {
			if (str[i] && isUpper(str[i])) {
				rep[i] = rep[i].toUpperCase();
			}
		}
		return rep;
	}
	return x
	.replace(/damn/gi, function(s) {
		return replaceWith(s, 'dang');
	})
	.replace(/fuck/gi, function(s) {
		return replaceWith(s, 'heck');
	})
	.replace(/shit/gi, function(s) {
		return replaceWith(s, 'poop');
	})
	.replace(/piss/gi, function(s) {
		return replaceWith(s, 'pee');
	})
	.replace(/(?:r|l)/gi, function(s) {
		return replaceWith(s, 'w');
	})
	.replace(/ove/gi, function(s) {
		return replaceWith(s, 'uv');
	})
	.replace(/qu/gi, function(s) {
		return replaceWith(s, 'kw');
	})
	.replace(/\bth/gi, function(s) {
		return replaceWith(s, 'd');
	})
	.replace(/th\b/gi, function(s) {
		return replaceWith(s, 'f');
	})
	.replace(/n([aeiou])/g, 'ny$1').replace(/N([aeiou])/g, 'Ny$1').replace(/N([AEIOU])/g, 'NY$1')
	 + ' ' + random(OwO);
};
