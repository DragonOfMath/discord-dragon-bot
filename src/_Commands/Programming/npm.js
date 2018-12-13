const ProcPromise = require('../../Structures/ProcPromise');
const {Markdown:md,fetch} = require('../../Utils');

class Npm {
	static get(pkgName, version) {
		return fetch('https://registry.npmjs.org/' + pkgName.toLowerCase() + (version ? '/' + version : ''), {json: true})
		.then(pkg => new Package(pkg));
	}
	static search(keywords) {
		keywords = keywords.toLowerCase().replace(/ /g, '+');
		return fetch('http://npmsearch.com/query?fields=name&size=20&q='+keywords, {json: true});
	}
	static install(pkgName, version) {
		pkgName = pkgName.toLowerCase() + (version ? '@' + version : '');
		return ProcPromise.exec('npm', ['i', pkgName, '--save'])
		.then(() => pkgName);
	}
	static version(pkgName) {
		pkgName = pkgName.toLowerCase();
		return ProcPromise.exec('npm', ['view', pkgName, 'version']);
	}
}

class Package {
	constructor(obj) {
		Object.assign(this, obj);
		
		this.author = new NpmUser(this.author);
		for (let id in this.maintainers) {
			this.maintainers[id] = new NpmUser(this.maintainers[id]);
		}
		
		this.repository = new Repo(this.repository);
		
		for (let version in this.time) {
			this.time[version] = new Date(this.time[version]);
		}
	}
	toString() {
		return this.name + (this.version ? '@' + this.version : '');
	}
	get installation() {
		return 'npm i ' + this.toString();
	}
	get url() {
		return 'https://npmjs.com/package/' + this.name;
	}
	embed() {
		return {
			title: this.name,
			url: this.url,
			description: this.description,
			timestamp: this.time.modified,
			color: 0xcb3837,
			fields: [
				{
					name: ':inbox_tray: Installation',
					value: md.codeblock(this.installation),
					inline: true
				},
				{
					name: ':package: Repository',
					value: this.repository.toString(),
					inline: true
				},
				{
					name: ':link: Homepage',
					value: this.homepage || '(none)',
					inline: true
				},
				{
					name: ':busts_in_silhouette: Author/Maintainers',
					value: [this.author, ...this.maintainers].map(m => m.toString()).join(', ')
				},
				{
					name: ':abcd: Keywords',
					value: this.keywords ? this.keywords.join(', ') : '(none)'
				}
			]
		};
	}
}

class NpmUser {
	constructor(obj) {
		this.name  = obj.name;
		this.email = obj.email;
	}
	toString() {
		if (this.email) {
			return md.link(this.name,  this.email);
		} else {
			return this.name;
		}
	}
}

class Repo {
	constructor(obj) {
		this.type = obj.type;
		this.url  = obj.url;
	}
	toString() {
		return md.link(this.type, this.url);
	}
}

Npm.Package = Package;
Npm.User    = NpmUser;
Npm.Repo    = Repo;

module.exports = Npm;
