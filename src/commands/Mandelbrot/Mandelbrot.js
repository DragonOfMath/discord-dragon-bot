const {Point,Partition} = require('./2d');
const Array2D = require('./array2');

const LOG2 = Math.log(2);

class Mandelbrot {
	constructor(args = {}) {
		this.center = args.center || new Point(-0.5,0);
		this.kx     = args.kx     || 0;
		this.ky     = args.ky     || 0;
		this.zoom   = args.zoom   || 300;
		this.depth  = args.depth  || 48;
		
		this.partitionDepth = args.partitionDepth || 5;
		this.antiAliasing   = !!args.antiAliasing;
		
		this.width  = args.width  || 1024;
		this.height = args.height || 1024;
		
		this.data  = new Array2D(this.height, this.width);
	}
	
	reset() {
		this.center.x = -0.5;
		this.center.y = 0;
		this.kx = 0;
		this.ky = 0;
		this.zoom = 300;
		this.depth = 48;
	}
	
	render() {
		if (this.data.rows == this.height && this.data.cols == this.width) {
			this.data.fill(0);
		} else {
			//this.width  = screen.width;
			//this.height = screen.height - 120;
			this.data.resize(this.height, this.width).fill(0);
		}
		var p = new Partition(new Point(0,0), new Point(this.width-1, this.height-1));
		this.processPartition(p, this.partitionDepth);
	}
	
	translateToReal(x) {
		return this.center.x + (x - this.width / 2) / this.zoom;
	}
	translateFromReal(x) {
		return ~~((x - this.center.x) * this.zoom + this.width / 2);
	}
	translateToImag(y) {
		return this.center.y + (this.height/ 2 - y) / this.zoom;
	}
	translateFromImag(y) {
		return ~~(this.height / 2 - (y - this.center.y) * this.zoom);
	}
	iterate(x,y) {
		var zx = this.kx,
			zy = this.ky,
			tx,zx2,zy2,i=0,d=this.depth;
		for (;i<d;++i) {
			zx2 = zx * zx;
			zy2 = zy * zy;
			if (zx2 + zy2 > 4) break;
			tx = zx2 - zy2 + x;
			zy = 2 * zx * zy + y;
			zx = tx;
		}
		// https://en.wikipedia.org/wiki/Mandelbrot_set#Escape_time_algorithm
		if (this.antiAliasing && i < d) {
			i += 1 - (Math.log((Math.log(zx * zx + zy * zy) / 2) / LOG2) / LOG2);
		}
		return i;
	}
	z(x,y) {
		return this.data[y][x] || (this.data[y][x] = this.iterate(this.translateToReal(x),this.translateToImag(y)));
	}
	
	processPartition(P, depth) {
		var x = P.center.x,
			y = P.center.y,
			t = this.z(x,y),
			s = 1,
			start, end;
			
		for(start=P.topLeft,end=P.topRight,x=start.x,y=start.y;x<end.x;++x)
			s&=t==this.z(x,y);
		for(start=end,end=P.bottomRight;y<end.y;++y)
			s&=t==this.z(x,y);
		for(start=end,end=P.bottomLeft;x>end.x;--x)
			s&=t==this.z(x,y);
		for(start=end,end=P.topLeft;y>end.y;--y)
			s&=t==this.z(x,y);
		
		t = s ? t : -1;
		
		if (t > -1) {
			this.data.fill(t,P.topY,P.leftX,P.bottomY,P.rightX);
		} else if (depth) {
			this.processPartition(P.upperLeft,  depth - 1);
			this.processPartition(P.upperRight, depth - 1);
			this.processPartition(P.lowerLeft,  depth - 1);
			this.processPartition(P.lowerRight, depth - 1);
		} else {
			for(y=P.topY;y<=P.bottomY;++y)
				for(x=P.leftX;x<=P.rightX;++x)
					this.z(x,y);
		}
	}
}

module.exports = Mandelbrot;
