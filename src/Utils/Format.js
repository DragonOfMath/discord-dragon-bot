class Format {
	static padding(x, p) {
		x = String(x);
		return x.length < p ? Array(p - x.length).fill(0).join('') + x : x;
	}
	static plural(s, x) {
		return `${x} ${s}${x!=1?'s':''}`;
	}
	static ordinal(x) {
		return ['1st','2nd','3rd'][(x % 100) < 10 && (x % 100 > 20) && (x % 10) - 1] || (x + 'th');
	}
	static insertCommas(x) {
		if (x >= 0 && x < 1000) {
			return x;
		}
		if (x < 0) {
			return '-' + this.insertCommas(Math.abs(x));
		}
		let decimal = '';
		if (x % 1 > 0) {
			decimal = String(x).match(/\.(\d+)$/)[1];
			x = Math.floor(x);
		}
		let str = ''
		while (x > 999) {
			str = ',' + this.padding(x % 1000, 3) + str;
			x = Math.floor(x/1000);
		}
		str = x + str;
		if (decimal) {
			str = str + '.' + decimal;
		}
		return str;
	}
	static currency(amt, type = '$', precision = 2) {
		if (typeof(amt) !== 'number') {
			amt = Number(amt);
		}
		return `${type}${this.insertCommas(amt.toFixed(precision))}`;
	}
	static percent(p, r = 2) {
		p *= 100;
		return p.toFixed(r) + '%';
	}
	static time(t) {
		t = Math.floor(t);
		let ms = t % 1000;
		t = Math.floor(t/1000);
		let sec = t % 60;
		t = Math.floor(t/60);
		let min = t % 60;
		t = Math.floor(t/60);
		let hr = t % 24;
		t = Math.floor(t/24);
		let dd = t;
		let time = [];
		if (dd)  time.push(this.plural('day',dd));
		if (hr)  time.push(this.plural('hour',hr));
		if (min) time.push(this.plural('minute',min));
		if (sec) time.push(this.plural('second',sec));
		if (!(dd || hr || min || sec)) {
			if (ms) {
				time.push(this.plural('millisecond',ms));
			} else {
				time.push('no time');
			}
		}
		return time.join(' ');
	}
	static shorttime(t,parts=4) {
		t = Math.floor(t);
		let ms = t % 1000;
		t = Math.floor(t/1000);
		let sec = t % 60;
		t = Math.floor(t/60);
		let min = t % 60;
		t = Math.floor(t/60);
		let hr = t % 24;
		t = Math.floor(t/24);
		let dd = t;
		let time = [];
		if (dd)  time.push(this.plural('d',dd));
		if (hr)  time.push(this.plural('h',hr));
		if (min) time.push(this.plural('m',min));
		if (sec) time.push(this.plural('s',sec));
		return time.slice(0,parts).join(' ');
	}
	static timestamp(t) {
		let sign = t < 0 ? '-' : '';
		t = Math.floor(Math.abs(t));
		let ms = (t % 1000);
		t = Math.floor(t/1000);
		let sec = t % 60;
		t = Math.floor(t/60);
		let min = t % 60;
		t = Math.floor(t/60);
		let hr = t % 24;
		t = Math.floor(t/24);
		let dd = t;
		if (dd) {
			return `${sign}${this.padding(dd,2)}:${this.padding(hr,2)}:${this.padding(min,2)}:${this.padding(sec,2)}`;
		} else if (hr) {
			return `${sign}${this.padding(hr,2)}:${this.padding(min,2)}:${this.padding(sec,2)}`;
		} else {
			return `${sign}${this.padding(min,2)}:${this.padding(sec,2)}`;
		}
	}
	static bytes(b) {
		if (b < 1024) {
			return `${b} B`;
		}
		b /= 1024;
		if (b < 1024) {
			b = ~~(b * 10) / 10;
			return `${b} KB`;
		}
		b /= 1024;
		b = ~~(b * 10) / 10;
		return `${b} MB`;
	}
	static relativeOrder(n,precision=2) {
		n = Number(n);
		let order = Math.floor(Math.log(n) / Math.log(1000));
		if (order != 0) n /= 1000 ** order;
		n = n.toPrecision(precision);
		if (order > 0 && order < 6) {
			n+= ['k','M','B','T','Q'][order-1];
		}
		return n;
	}
	static scientificNotation(n,precision=2) {
		return Number(n).toExponential(precision);
	}
	static coordinates(latitude, longitude) {
		return [Math.abs(latitude),(latitude>=0?'N':'S'),Math.abs(longitude),(longitude>=0?'E':'W')].join(' ');
	}
}

module.exports = {Format};