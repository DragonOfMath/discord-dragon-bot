const npm = require('./npm');
const {Markdown:md} = require('../../Utils');

module.exports = {
	'npm': {
		aliases: ['npmjs', 'nodejs', 'node'],
		category: 'Programming',
		title: 'npm',
		info: 'Get information about a Node.js package.',
		parameters: ['package','[version]'],
		permissions: 'inclusive',
		fn({client, args}) {
			let [packageName, version] = args;
			return npm.get(packageName, version)
			.then(pkg => pkg.embed());
		},
		subcommands: {
			'search': {
				aliases: ['s'],
				title: 'npm',
				info: 'Search packages on the npm registry.',
				parameters: ['keywords'],
				fn({client, arg}) {
					return npm.search(arg)
					.then(res => {
						if (res.total == 0) {
							return 'No results found.';
						}
						return {
							title: 'Search results for ' + arg,
							description: res.results.map(r => md.link(r.name, 'https://npmjs.com/package/'+r.name)).join(', '),
							footer: {
								text: 'Showing ' + res.results.length + ' of ' + res.total + ' total'
							}
						};
					});
				}
			},
			'install': {
				aliases: ['i'],
				title: 'npm | Install Package',
				info: 'Install a node package into your default `node_modules` folder.',
				parameters: ['package', '[version]'],
				permissions: 'private',
				suppress: true,
				analytics: false,
				fn({client, args}) {
					let [packageName, version] = args;
					return npm.install(packageName, version)
					.then(pkg => `Successfully installed ${md.code(pkg)}. :package:`);
				}
			},
			'version': {
				aliases: ['v'],
				title: 'npm | Check Version',
				info: 'Gets the version of a node module.',
				parameters: ['package'],
				permissions: 'inclusive',
				fn({client, args}) {
					let pkgName = args[0];
					return npm.version(pkgName)
					.then(version => `The latest version of ${md.code(pkgName)} is ${version}`);
				}
			}
		}
	}
};
