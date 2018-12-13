const {Jimp,Path,Color} = require('../../../Utils');

const WHITE      = 0xFFFFFFFF;
const LIGHT_GREY = 0xA0A0A0FF;
const DARK_GREY  = 0x050505FF;
const BLACK      = 0x000000FF;

class Graph {
	constructor(data, options = {}) {
		if (typeof(options.width) === 'undefined') {
			options.width = 800;
		}
		if (typeof(options.height) === 'undefined') {
			options.height = Math.floor(0.75 * options.width);
		}
		this.image   = new Jimp(options.width, options.height, WHITE);
		this.options = options;
		this.data    = data;
		
		// use padding for fixating the graph in the image bitmap
		this.padding = this.options.padding || 40;
		
		// coordinates for the graph layout
		this.left   = 0 + this.padding;
		this.top    = 0 + this.padding;
		this.right  = this.image.bitmap.width  - this.padding;
		this.bottom = this.image.bitmap.height - this.padding;
		this.width  = this.right   - this.left;
		this.height = this.top     - this.bottom;
		
		this.center = [(this.left + this.right) / 2, (this.top + this.bottom) / 2];
		this.useIndexAsDomain = false;
		if (!(this.data[0] instanceof Array)) {
			this.useIndexAsDomain = true;
			this.data = this.data.map((x,i) => [i,x]);
		}
		
		this.minimumX = this.data[0][0];
		this.maximumX = this.data[0][0];
		this.minimumY = this.data[0][1];
		this.maximumY = this.data[0][1];
		for (let d of this.data) {
			if (isNaN(d[0])) {
				this.useIndexAsDomain = true;
			} else if (!this.useIndexAsDomain) {
				d[0] = Number(d[0]);
				if (d[0] < this.minimumX) {
					this.minimumX = d[0];
				}
				if (d[0] > this.maximumX) {
					this.maximumX = d[0];
				}
			}
			d[1] = Number(d[1]);
			if (d[1] < this.minimumY) {
				this.minimumY = d[1];
			}
			if (d[1] > this.maximumY) {
				this.maximumY = d[1];
			}
		}

		if (this.useIndexAsDomain) {
			this.minimumX = 0;
			this.maximumX = this.data.length;
		}

		if (typeof(this.options.minimumX) !== 'undefined') {
			this.minimumX = Number(this.options.minimumX);
		}
		if (typeof(this.options.maximumX) !== 'undefined') {
			this.maximumX = Number(this.options.maximumX);
		}
		if (typeof(this.options.minimumY) !== 'undefined') {
			this.minimumY = Number(this.options.minimumY);
		}
		if (typeof(this.options.maximumY) !== 'undefined') {
			this.maximumY = Number(this.options.maximumY);
		}
		
		// fix domain to fit all x values
		this.magnitudeX = Math.ceil(Math.log10(this.rangeX));
		this.intervalX  = Math.pow(10, this.magnitudeX - 1);
		if (this.intervalX >  this.rangeX / 2) {
			// fix very wide intervals
			this.intervalX /= 10;
		}
		//this.maximumX += this.intervalX;
		
		// fix range to fit all y values
		this.magnitudeY = Math.ceil(Math.log10(this.rangeY));
		this.intervalY  = Math.pow(10, this.magnitudeY - 1);
		this.minimumY -= this.intervalY;
		this.maximumY += this.intervalY;
		
		this.spacingX   = Math.floor(this.width / (this.rangeX / this.intervalX));
		this.spacingY   = Math.floor(this.height / (this.rangeY / this.intervalY));
	}
	get rangeX() {
		return this.maximumX - this.minimumX;
	}
	get rangeY() {
		return this.maximumY - this.minimumY;
	}
	
	toGraphX(dataX) {
		return this.left + this.width * ((dataX - this.minimumX) / this.rangeX);
	}
	toGraphY(dataY) {
		return this.bottom + this.height * ((dataY - this.minimumY) / this.rangeY);
	}
	toGraphPos(dataX, dataY) {
		return [this.toGraphX(dataX), this.toGraphY(dataY)];
	}
	
	sortData() {
		this.data = this.data.sort((p0,p1) => p0[0] > p1[0] ? 1 : p0[0] < p1[0] ? -1 : 0);
	}
	
	/**
	 * Draws text to the graph.
	 */
	addText(text, size = 16, x = 0, y = 0, width = this.width, height = this.height, alignmentX = 'center', alignmentY = 'middle') {
		this.image.print(Graph.Fonts[size], x, y, {
			text: String(text),
			alignmentX: Jimp['HORIZONTAL_ALIGN_'+alignmentX.toUpperCase()],
			alignmentY: Jimp['VERTICAL_ALIGN_'+alignmentY.toUpperCase()]
		}, width, height);
	}
	/**
	 * Draws the graph title.
	 */
	addTitle(title = this.options.title) {
		if (title) {
			this.addText(title, 32, 0, 0, this.image.bitmap.width, this.padding);
		}
	}
	/**
	 * Draws the X-axis and label.
	 */
	addXAxis(ypos, label) {
		this.image.drawLine(this.left, ypos, this.right, ypos, BLACK);
		if (label) {
			// draw the x-axis label
			this.addText(label, 16, this.left, ypos + 8, this.width, this.padding - 8);
		}
	}
	/**
	 * Draws the y-axis and label.
	 */
	addYAxis(xpos, label) {
		this.image.drawLine(xpos, this.bottom, xpos, this.top, BLACK);
		if (label) {
			// draw the y-axis label (first it must be drawn on a separate bitmap)
			let labelWidth = Math.abs(this.height);
			let labelHeight = this.padding - 8;
			let labelImg = new Jimp(labelWidth, labelHeight, WHITE);
			labelImg.print(Graph.Fonts[16], 0, 0, {
				text: label,
				alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
				alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
			}, labelWidth, labelHeight);
			// turn the image so that the text is parallel to the y-axis
			labelImg.rotate(90); // JIMP BUG: rotations are opposite
			// paste the label to the graph
			this.image.composite(labelImg, xpos - this.padding, this.padding);
		}
	}
	addXInterval(x, line, text, color = LIGHT_GREY) {
		let gx = this.toGraphX(x);
		if (line) {
			this.image.drawLine(gx, this.bottom, gx, this.top, color);
		}
		if (text !== undefined) {
			this.addText(String(text), 8, gx, this.bottom, this.spacingX, 10, 'left');
		}
	}
	addYInterval(y, line, text, color = LIGHT_GREY) {
		let gy = this.toGraphY(y);
		if (line) {
			this.image.drawLine(this.left, gy, this.right, gy, color);
		}
		if (text !== undefined) {
			this.addText(String(text), 8, this.left - this.padding, gy, this.padding, 10, 'right');
		}
	}
	constructAxes() {
		// draw the origin
		if (this.minimumX < 0 && this.maximumX > 0) {
			this.addXInterval(0, this.options.origin || this.options.grid, '0', BLACK);
		}
		if (this.minimumY < 0 && this.maximumY > 0) {
			this.addYInterval(0, this.options.origin || this.options.grid, '0', BLACK);
		}
		
		// draw the axes AFTER the intervals/origin
		this.addXAxis(this.bottom, this.options.xaxis);
		this.addYAxis(this.left, this.options.yaxis);
		
		if (this.options.borders) {
			this.addXAxis(this.top);
			this.addYAxis(this.right);
		}
	}
	constructIntervals() {
		// draw the x-axis intervals
		let intervalX = this.intervalX, decimalPlacesX = Math.max(0,-this.magnitudeX);
		for (let x = intervalX; x < this.maximumX; x += intervalX) {
			this.addXInterval(x, this.options.grid, x.toFixed(decimalPlacesX));
		}
		for (let x = -intervalX; x > this.minimumX; x -= intervalX) {
			this.addXInterval(x, this.options.grid, x.toFixed(decimalPlacesX));
		}
		
		// draw the y-axis intervals
		let intervalY = this.intervalY, decimalPlacesY = Math.max(0,-this.magnitudeY);
		for (let y = intervalY; y < this.maximumY; y += intervalY) {
			this.addYInterval(y, this.options.grid, y.toFixed(decimalPlacesY));
		}
		for (let y = -intervalY; y > this.minimumY; y -= intervalY) {
			this.addYInterval(y, this.options.grid, y.toFixed(decimalPlacesY));
		}
	}
	
	drawLineGraph() {
		let path = new Path();
		for (let x = 0; x < this.data.length; x++) {
			let data = this.data[x];
			let p0 = this.toGraphPos(data[0], data[1]);
			path.addPoint(p0);
		}
		this.image.drawPath(path, Color.random().rgba);
	}
	drawScatterplotGraph() {
		for (let x = 0; x < this.data.length; x++) {
			let data = this.data[x];
			let p0 = this.toGraphPos(data[0], data[1]);
			this.image.fill(BLACK, p0[0] - 1, p0[1] - 1, 3, 3);
		}
	}
	drawLineOfBestFit() {
		let N = this.data.length;
		let xs = this.data.map(d => d[0]);
		let ys = this.data.map(d => d[1]);
		
		switch (this.options.fit) {
			case 'linear':
				// https://en.wikipedia.org/wiki/Covariance
				let centerx = Math.average(xs);
				let centery = Math.average(ys);
				let covariance = this.data.reduce((sum,d) => sum + (d[0] - centerx) * (d[1] - centery), 0) / N;
				
				// https://en.wikipedia.org/wiki/Correlation_and_dependence#Pearson's_product-moment_coefficient
				let stddevx = Math.standardDeviation(xs);
				let stddevy = Math.standardDeviation(ys);
				let coefficient = covariance / (stddevx * stddevy);
				// TODO
				break;
			case 'regressive':
				break;
		}
	}
	drawBarGraph() {
		let y0 = this.toGraphY(0);
		for (let x = 0; x < this.data.length; x++) {
			let data = this.data[x];
			let x0 = this.toGraphX(x);
			let y1 = this.toGraphY(data[1]);
			let color = Color.random().rgba;
			if (y1 > y0) {
				// bar is below 0
				this.image.fill(color, x0 + 2, y0, this.spacingX - 4, y1 - y0);
				this.addText(data[1], 8, x0, y1 + 10, this.spacingX, 10);
			} else {
				// bar is above 0
				this.image.fill(color, x0 + 2, y1, this.spacingX - 4, y0 - y1);
				this.addText(data[1], 8, x0, y1 - 10, this.spacingX, 10);
			}
			// bar label
			this.addText(data[0], 16, x0, this.bottom, this.spacingX, 20);
		}
	}
	constructPie() {
		let sum    = this.data.reduce((a,d) => a += d[1], 0),
		    radius = Math.min(this.width, Math.abs(this.height)) / 2,
			center = this.center,
		    theta  = 0,
			STEPS  = 100,
			TAU    = 2 * Math.PI,
			delta  = TAU / STEPS,
			colors = [];
		
		// align the pie chart
		center[0] = radius + this.padding;
			
		// render each slice
		for (let i = 0; i < this.data.length; i++) {
			let data = this.data[i];
			
			// start a new linear path starting and ending at the center
			let path = new Path([center], 'linear');
			function circ(p, r, t) {
				return [
					p[0] + r * Math.sin(t),
					p[1] - r * Math.cos(t)
				]
			}
			// add steps to the arc path
			let steps = STEPS * data[1] / sum;
			let ds    = 1;
			while (steps > 0) {
				path.addPoint(circ(center,radius,theta));
				ds = Math.min(steps, 1);
				steps -= ds;
				theta += delta * ds;
			}
			path.addPoint(circ(center,radius,theta));
			
			// repeat back to the origin
			path.closePath();
			
			// pick a random color and store it
			let color = Color.random().rgba;
			colors.push(color);
			
			// fill the path with the assigned color
			this.image.fillPath(path, color);
		}
		
		// okay, the pie is done, but it's unlabeled.
		// unfortunately, it's a bad idea to label directly over it.
		// instead, let's build a legend off to the side using the colors stored earlier.
		let legend = [center[0] + radius + this.padding, this.padding];
		let boxSize = 16;
		let lineHeight = boxSize + 2;
		let textX = legend[0] + lineHeight;
		for (let i = 0; i < this.data.length; i++) {
			let data = this.data[i];
			this.image.fill(colors[i], legend[0] + 1, legend[1] + 1 + (i * lineHeight), boxSize, boxSize);
			this.addText(`${data[0]} (${data[1]})`, 16, textX, legend[1] + (i * lineHeight), this.image.bitmap.width - textX, 16, 'left');
		}
	}
	
	static createLineGraph(data, options = {}) {
		let graph = new Graph(data, options);
		graph.sortData();
		graph.addTitle();
		graph.constructAxes();
		graph.constructIntervals();
		graph.drawLineGraph();
		return graph;
	}
	static createScatterGraph(data, options = {}) {
		// for a plot graph, sorting the data isn't necessary
		let graph = new Graph(data, options);
		graph.addTitle();
		graph.constructAxes();
		graph.constructIntervals();
		graph.drawScatterplotGraph();
		//graph.drawLineOfBestFit();
		return graph.image;
	}
	static createBarGraph(data, options = {}) {
		let graph = new Graph(data, options);
		graph.addTitle();
		graph.constructAxes();
		graph.constructIntervals();
		graph.drawBarGraph();
		return graph;
	}
	static createPieChart(data, options = {}) {
		options.width  = 800;
		options.height = 500;
		let graph = new Graph(data, options);
		graph.sortData();
		graph.addTitle();
		graph.constructPie();
		return graph;
	}
}

// Preload the fonts to make rendering text way way faster
(async function () {
	Graph.Fonts = {
		 8: await Jimp.loadFont(Jimp.FONT_SANS_8_BLACK),
		12: await Jimp.loadFont(Jimp.FONT_SANS_12_BLACK),
		16: await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK),
		32: await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK),
		64: await Jimp.loadFont(Jimp.FONT_SANS_64_BLACK)
	};
})();

module.exports = Graph;
