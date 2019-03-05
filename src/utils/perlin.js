function lerp(a0,a1,w) {
    return a0 * (1-w) + a1 * w;
}
function cosinterp(a0,a1,w) {
	return lerp(a0,a1,(1-Math.cos(w*Math.PI))/2);
}
function mod(n, m) {
    return ((n % m) + m) % m;
}
function fade(t) {
	return t*t*t*(t*(t*6-15)+10);
}
function scale(t) {
	return (1+t)/2;
}

class Gradient {
	constructor(r,theta,phi) {
		r     = typeof(r)      === 'number' ? r     : Math.random();
		theta = typeof (theta) === 'number' ? theta : (2 * Math.PI * Math.random());
		phi   = typeof (phi)   === 'number' ? phi   : (Math.PI * Math.random());
		this.dx = r * Math.cos(theta) * Math.cos(phi);
		this.dy = r * Math.sin(theta) * Math.cos(phi);
		this.dz = r * Math.sin(phi);
	}
	dot(x,y,z) {
		return (x * this.dx) + (y * this.dy) + (z * this.dz);
	}
}

class Perlin1 {
	constructor(gridsize) {
		this.size = gridsize;
		this.gradient = [];
		for (var x=0;x<gridsize;x++){
			this.gradient.push(new Gradient());
		}
	}
	dotGradient(ix,x) { 
		return this.gradient[ix % this.size].dot(x-ix,0,0);
	}
	noise(x) {
		var x0 = x | 0,
			x1 = x0 + 1,
			tx = mod(x, 1);
		var value = lerp(
			this.dotGradient(x0,x),
			this.dotGradient(x1,x),
		tx);
		//value = scale(value);
		//value = fade(value);
		return value;
	}
}

class Perlin2 {
	constructor(gridsize) {
		this.size = gridsize;
		this.gradient = [];
		for (var y=0;y<gridsize;y++) {
			this.gradient.push(new Perlin1(gridsize).gradient);
		}
	}
	dotGradient(ix,iy,x,y) {
		return this.gradient[iy % this.size][ix % this.size].dot(x-ix,y-iy,0);
	}
	noise(x,y) {
		var x0 = x | 0,
			y0 = y | 0,
			x1 = x0 + 1,
			y1 = y0 + 1,
			tx = mod(x, 1),
			ty = mod(y, 1);
		var value = lerp(
			lerp(
				this.dotGradient(x0,y0,x,y),
				this.dotGradient(x1,y0,x,y),
			tx),
			lerp(
				this.dotGradient(x0,y1,x,y),
				this.dotGradient(x1,y1,x,y),
			tx),
		ty);
		//value = scale(value);
		//value = fade(value);
		return value;
	}
}

class Perlin3 {
	constructor(gridsize) {
		this.size = gridsize;
		this.gradient = [];
		for (var z=0;z<gridsize;z++) {
			this.gradient.push(new Perlin2(gridsize).gradient);
		}
	}
	dotGradient(ix,iy,iz,x,y,z) {
		return this.gradient[iz % this.size][iy % this.size][ix % this.size].dot(x-ix,y-iy,z-iz);
	}
	noise(x,y,z) {
		var x0 = x | 0,
			y0 = y | 0,
			z0 = z | 0,
			x1 = x0 + 1,
			y1 = y0 + 1,
			z1 = z0 + 1,
			tx = mod(x, 1),
			ty = mod(y, 1),
			tz = mod(z, 1);
		var value = cosinterp(
			lerp(
				lerp(
					this.dotGradient(x0,y0,z0,x,y,z),
					this.dotGradient(x1,y0,z0,x,y,z),
				tx),
				lerp(
					this.dotGradient(x0,y1,z0,x,y,z),
					this.dotGradient(x1,y1,z0,x,y,z),
				tx),
			ty),
			lerp(
				lerp(
					this.dotGradient(x0,y0,z1,x,y,z),
					this.dotGradient(x1,y0,z1,x,y,z),
				tx),
				lerp(
					this.dotGradient(x0,y1,z1,x,y,z),
					this.dotGradient(x1,y1,z1,x,y,z),
				tx),
			ty),
		tz);
		//value = scale(value);
		//value = fade(value);
		return value;
	}
}

module.exports = {
	Perlin1,
	Perlin2,
	Perlin3
};
