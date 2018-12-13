const Jimp = require('jimp');

const ERROR = -0.12;
const CARD_WIDTH = 3362 / 14 + ERROR;
const CARD_HEIGHT = 1442 / 4 + ERROR;

const MAP = [
	['red_0',   'red_1',   'red_2',   'red_3',   'red_4',   'red_5',   'red_6',   'red_7',   'red_8',   'red_9',   'red_skip',   'red_reverse',   'red_plus2',   'wildcard'],
	['yellow_0','yellow_1','yellow_2','yellow_3','yellow_4','yellow_5','yellow_6','yellow_7','yellow_8','yellow_9','yellow_skip','yellow_reverse','yellow_plus2','plus4'],
	['green_0', 'green_1', 'green_2', 'green_3', 'green_4', 'green_5', 'green_6', 'green_7', 'green_8', 'green_9', 'green_skip', 'green_reverse', 'green_plus2'],
	['blue_0',  'blue_1',  'blue_2',  'blue_3',  'blue_4',  'blue_5',  'blue_6',  'blue_7',  'blue_8',  'blue_9',  'blue_skip',  'blue_reverse',  'blue_plus2']
];

(async function () {
let map = await Jimp.read('./uno_cards.png');
for (let cy = 0; cy < MAP.length; cy++) {
	for (let cx = 0; cx < MAP[cy].length; cx++) {
		let card = map.clone().crop(cx * CARD_WIDTH, cy * CARD_HEIGHT, CARD_WIDTH+1, CARD_HEIGHT+1);
		await card.write(`./cards/${MAP[cy][cx]}.png`);
	}
}
})();
