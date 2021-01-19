const {random,matchCase} = require('../../../Utils');

const OwO = ['(・`ω´・)','(´・ω・`)',';;w;;','OwO','owo','UwU','uwu','>w<','^w^','x3','X3',':3'];

/*
	owoify from https://github.com/MalHT/hewwobot/blob/master/bot.js
	Additional tidbits from https://github.com/Printendo/HewwoStudio
*/
module.exports = function owoify(x) {
	return (x ? x
	.replace(/damn/gi, function(s) {
		return matchCase(s, 'dang');
	})
	.replace(/fuck/gi, function(s) {
		return matchCase(s, 'heck');
	})
	.replace(/shit/gi, function(s) {
		return matchCase(s, 'poop');
	})
	.replace(/piss/gi, function(s) {
		return matchCase(s, 'pee');
	})
	.replace(/(?:r|l)/gi, function(s) {
		return matchCase(s, 'w');
	})
	.replace(/ove/gi, function(s) {
		return matchCase(s, 'uv');
	})
	.replace(/qu/gi, function(s) {
		return matchCase(s, 'kw');
	})
	.replace(/\bth/gi, function(s) {
		return matchCase(s, 'd');
	})
	.replace(/th\b/gi, function(s) {
		return matchCase(s, 'f');
	})
	.replace(/n([aeiou])/g, 'ny$1').replace(/N([aeiou])/g, 'Ny$1').replace(/N([AEIOU])/g, 'NY$1')
	: '') + ' ' + random(OwO);
};
