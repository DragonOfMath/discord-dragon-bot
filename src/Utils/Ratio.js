if (typeof BigInt === 'undefined') {
	throw 'Well that\'s gonna be a problem...';
}

// new Ratio()
// new Ratio(0)
// new Ratio(3.14,1.3)
// new Ratio(ratio)
// new Ratio(BigInt(1), BigInt(2))
// new Ratio("12345678901234567890")
class Ratio {
	constructor(p,q) {
		if (p && p instanceof Ratio) {
			this.p = p.p;
			this.q = p.q;
		} else {
			let ratioAdjust = 0;
			switch (typeof q) {
				case 'undefined':
					q = 1n;
					break;
				case 'string':
					q = BigInt(q);
					break;
				case 'number':
					ratioAdjust = q;
					q = 1n;
					break;
			}
			switch (typeof p) {
				case 'undefined':
					p = 0n;
					break;
				case 'number':
					if (ratioAdjust % 1 !== 0) {
						p = p / ratioAdjust;
					}
					if (p % 1 !== 0) {
						p = p.toString();
						q = 10n ** BigInt(p.length-1-p.indexOf('.'));
						p = p.replace('.', '');
					}
				case 'string':
					p = BigInt(p);
					break;
			}
			if (q < 0n) {
				p *= -1n;
				q = -q;
			}
			this.p = p;
			this.q = q;
			this.reduce();
		}
	}
	copy(r) {
		if (!(r instanceof Ratio)) {
			r = new Ratio(r);
		}
		this.p = r.p;
		this.q = r.q;
		return this;
	}
	add(r) {
		if (!(r instanceof Ratio)) {
			r = new Ratio(r);
		}
		return new Ratio(this.p * r.q + this.q * r.p, this.q * r.q);
	}
	sub(r) {
		if (!(r instanceof Ratio)) {
			r = new Ratio(r);
		}
		return new Ratio(this.p * r.q - this.q * r.p, this.q * r.q);
	}
	mul(r) {
		if (!(r instanceof Ratio)) {
			r = new Ratio(r);
		}
		return new Ratio(this.p * r.p, this.q * r.q);
	}
	div(r) {
		if (!(r instanceof Ratio)) {
			r = new Ratio(r);
		}
		if (r.p === 0) {
			return new Ratio(this.sign() * Infinity, 0);
		}
		return new Ratio(this.p * r.q, this.q * r.p);
	}
	pow(r) {
		if (!(r instanceof Ratio)) {
			r = new Ratio(r);
		}
		if (r.q === 1n) {
			return new Ratio(this.p ** r.p, this.q ** r.p);
		} else {
			return new Ratio(this.p ** r.p, this.q ** r.p).mul(this.root(r.q));
		}
	}
	root(r) {
		if (!(r instanceof Ratio)) {
			r = new Ratio(r);
		}
		let rRecip = r.recip();
		let rSub1  = r.sub(1);
		let guess  = new Ratio(1);
		for (let i = 0; i < 3; i++) {
			guess = rRecip.mul(rSub1.mul(guess).add(this.div(guess.pow(rSub1))));
		}
		return guess;
	}
	mod(r) {
		if (!(r instanceof Ratio)) {
			r = new Ratio(r);
		}
		return this.sub(r.mul(this.div(r).toBigInt()));
	}
	sign() {
		let sign = this.p ? 1 : 0;
		if (this.p < 0n) sign *= -1;
		if (this.q < 0n) sign *= -1;
		return sign;
	}
	recip() {
		return new Ratio(this.q, this.p);
	}
	reduce() {
		let a = this.p, b = this.q, t;
		while (b != 0n) {
			t = b;
			b = a % b;
			a = t;
		}
		this.p /= a;
		this.q /= a;
		return this;
	}
	clone() {
		return new Ratio(this);
	}
	toString() {
		return `${this.p}/${this.q}`;
	}
	toExponential(precision=10) {
		let p = this.p.toString().replace('-','');
		let q = this.q.toString().replace('-','');
		let power = (p.length - q.length);
		let fract = Number(p.substring(0,precision+1))/Number(q.substring(0,precision+1));
		let str = fract.toPrecision(precision);
		if (Math.abs(power) > precision) {
			while (fract >= 10) {
				fract /= 10;
				power++;
			}
			while (fract < 1) {
				fract *= 10;
				power--;
			}
		}
		if (Math.abs(power) > 1) {
			str += 'e' + power;
		}
		if (this.sign() < 0) {
			str = '-' + str;
		}
		return str;
	}
	toNumber() {
		return Number(this.p) / Number(this.q);
	}
	toBigInt() {
		return BigInt(this.p) / BigInt(this.q);
	}
	static add(a,b) {
		if (!(a instanceof Ratio)) {
			a = new Ratio(a);
		}
		return a.add(b);
	}
	static sub(a,b) {
		if (!(a instanceof Ratio)) {
			a = new Ratio(a);
		}
		return a.sub(b);
	}
	static mul(a,b) {
		if (!(a instanceof Ratio)) {
			a = new Ratio(a);
		}
		return a.mul(b);
	}
	static div(a,b) {
		if (!(a instanceof Ratio)) {
			a = new Ratio(a);
		}
		return a.div(b);
	}
	static pow(a,b) {
		if (!(a instanceof Ratio)) {
			a = new Ratio(a);
		}
		return a.pow(b);
	}
	static root(a,b) {
		if (!(a instanceof Ratio)) {
			a = new Ratio(a);
		}
		return a.root(b);
	}
	static mod(a,b) {
		if (!(a instanceof Ratio)) {
			a = new Ratio(a);
		}
		return a.mod(b);
	}
	static sign(a) {
		if (!(a instanceof Ratio)) {
			a = new Ratio(a);
		}
		return a.sign();
	}
	static recip(a) {
		if (!(a instanceof Ratio)) {
			a = new Ratio(a);
		}
		return a.recip();
	}
}

module.exports = {Ratio};
