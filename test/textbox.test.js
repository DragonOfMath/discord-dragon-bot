const {TextBox} = require('../src/Utils/TextBox');
const {SINGLE,DOUBLE} = TextBox.STROKE;
const {RECT,ROUND} = TextBox.CORNER;
let testbox = new TextBox(50, 20, {
	defaultStrokeStyle: SINGLE,
	defaultCornerStyle: RECT
});

testbox.drawBox(0, 0, 40, 16, DOUBLE, RECT, {});
testbox.drawBox(10,10,20, 15, SINGLE, ROUND);

testbox.drawHorizLine(0, 2, 40, SINGLE);
testbox.print('Hello World!', 5, 1);

testbox.drawVertLine(3, 0, 5, SINGLE);
testbox.drawVertLine(18, 0, 5, SINGLE);

console.log(testbox.toString());
