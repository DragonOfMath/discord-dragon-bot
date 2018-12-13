const KERNEL = [0,3,1,4,2,5,6,7];

function brailleify(image, options = {}) {
	options.align     = options.align     === undefined ? true  : !!options.align;
	options.invert    = options.invert    === undefined ? false : !!options.invert;
	options.threshold = options.threshold === undefined ? 120   : options.threshold;
	options.scale     = options.scale     === undefined ? 4     : options.scale;
	
	var w = image.width,
		h = image.height,
		a = options.align,       // Fix alignment issue with empty braille
		inv = options.invert,    // Switch the dark/light values
		th = +options.threshold, // the maximum value for darkness
		kc = +options.scale,     // kernel cell width in pixels
		ka = kc * kc,            // kernel cell area
		kw = kc * 2,             // kernel width
		kh = kc * 4,             // kernel height
		result = '',
		kernel,cell,value,
		x,y,kx,ky,ox,oy,cx,cy,pos,i;
	
	for (y = 0; y < h; y += kh) {
		for (x = 0; x < w; x += kw) {
			kernel = [];
			
			for (ky = 0; ky < kh; ky += kc) {
				oy = y + ky;
				for (kx = 0; kx < kw; kx += kc) {
					ox = x + kx;
					cell = [0,0,0];
					
					for (cy = 0; cy < kc; ++cy) {
						for (cx = 0; cx < kc; ++cx) {
							pos = 4 * ((oy + cy) * w + (ox + cx));
							for (i = 0; i < 3; i++) {
								cell[i] += ~~image.data[pos+i];
							}
						}
					}
					
					for (i = 0; i < 3; ++i) {
						cell[i] = Math.floor(cell[i] / ka);
					}
					
					// https://en.wikipedia.org/wiki/Relative_luminance
					value = 0.2126 * cell[0] + 0.7152 * cell[1] + 0.0722 * cell[2];
					kernel.push(value);
				}
			}
			
			value = 0;
			for (var i of KERNEL) if (kernel[i] < th) value += Math.pow(2,i);
			if (inv) value = 0xFF - value;
			if (a && value == 0) value = 0x80;
			result += String.fromCodePoint(0x2800 + value);
		}
		result += '\n';
	}
	
	return result;
}

if (typeof(window) === 'undefined' && typeof(navigator) === 'undefined' && typeof(module) !== 'undefined') {
	module.exports = brailleify;
}
