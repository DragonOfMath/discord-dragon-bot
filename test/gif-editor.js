const {GIF} = require('../src/Utils/gif');

(async function() {
	let gif = await GifUtil.read('./test-input.gif');
	console.log(gif);
	
	gif.debugFrames();
	await GifUtil.write('./test-debug.gif', gif.frames, gif);
	
	gif.renderAllFrames();
	await GifUtil.write('./test-output1.gif', gif.frames, gif);
	
	gif.frames.reverse();
	gif.optimizeFrames();
	await GifUtil.write('./test-output2.gif', gif.frames, gif);
})();
