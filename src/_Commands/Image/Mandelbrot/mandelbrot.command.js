const {Fractal,Mandelbrot,Newton} = require('./Mandelbrot');
const {Complex,ComplexFunction,ComplexGraph,ComplexShader,Color,Math,Markdown:md,paginate} = require('../../../Utils');

const LiveMessage = require('../../../Sessions/LiveMessage');

const UP = '⬆';
const DOWN = '⬇';
const LEFT = '⬅';
const RIGHT = '➡';
const CENTER = '🔙';
const ZOOM_IN = '➕';
const ZOOM_OUT = '➖';

class FractalExplorer extends LiveMessage {
	constructor(context, fractal, shader) {
		super(context.channelID);
		
		this.fractal = fractal ?? new Fractal;
		this.shader  = shader  ?? new ComplexShader;
		
		this._renderTimeMs = 0;
		
		this.on('reaction', async (ctx) => {
			if (ctx.user.id === this.userID) return;
			if (ctx.reaction in this.reactions && ctx.change > 0) {
				//await this.removeReaction(ctx.client, ctx.reaction, ctx.user.id);
				switch (ctx.reaction) {
					case CENTER:
						this.fractal.resetView();
						break;
					case RIGHT:
						this.fractal.offset.r += 10/this.fractal.zoom;
						break;
					case LEFT:
						this.fractal.offset.r -= 10/this.fractal.zoom;
						break;
					case UP:
						this.fractal.offset.i += 10/this.fractal.zoom;
						break;
					case DOWN:
						this.fractal.offset.i -= 10/this.fractal.zoom;
						break;
					case ZOOM_IN:
						this.fractal.zoom *= 2;
						break;
					case ZOOM_OUT:
						this.fractal.zoom /= 2;
						break;
					case LiveMessage.CLOSE:
						this.clearReactions(ctx.client);
						this.close(ctx.client);
						return;
				}
				
				this.main(ctx.client);
			}
		});
	}
	resize(w,h) {
		w = Math.minmax(w, 100, 2000);
		h = Math.minmax(h, 100, 2000);;
		this.fractal.setSize(w,h);
	}
	async main(client, skipRender = false) {
		try {
			await client.type(this.channelID);
			if (skipRender) {
				this.image = this.fractal.redraw(this.shader);
			} else {
				let start = Date.now();
				this.image = this.fractal.render(this.shader);
				let end = Date.now();
				this._renderTimeMs = end - start;
				this.updateEmbed();
			}
			//this.image = await this.image.getBufferAs('fractal.png');
			if (this.messageID) {
				// unfortunately, cannot replace existing message's attachments
				await this.resend(client);
			} else {
				await this.send(client);
			}
			await this.setupReactionInterface(client, FractalExplorer.CONFIG.interface);
		} catch (e) {
			return e;
		}
	}
	updateEmbed() {
		this.embed = this.embed ?? {};
		this.embed.title = FractalExplorer.CONFIG.displayName;
		this.embed.description = this.fractal.toString();
		this.embed.footer = {text:'Rendering time: ' + this._renderTimeMs + 'ms'};
		return this.embed;
	}
}

FractalExplorer.CONFIG = {
	displayName: 'Fractal Explorer',
	interface: [LEFT,UP,DOWN,RIGHT,ZOOM_IN,ZOOM_OUT,CENTER]
};

function getExplorer(client,channelID,fractal) {
	for (let messageID in client.liveMessages) {
		let message = client.liveMessages[messageID];
		if (message.channelID == channelID && (!fractal || message.fractal === fractal)) {
			return message;
		}
	}
	return null;
}

function parseComplexFunction(vars,fn) {
	try {
		let func = eval(`(${vars.join(',')}) => ${fn}`);
		// test for validity where f : C -> C
		if (!(func(new Complex()) instanceof Complex)) {
			throw new SyntaxError('Not a valid Complex function.');
		}
		return func;
	} catch (e) {
		if (e instanceof SyntaxError || e instanceof ReferenceError) {
			// interpret an arithmetic expression into complex function chains
			return new ComplexFunction(...vars,fn);
		} else {
			throw e;
		}
	}
}

function random(a,b) {
	return a + (b - a) * Math.random();
}

function toID(x) {
	return typeof(x) === 'string' ? x.toLowerCase().replace(/\s+/g, '_') : x;
}

const globalShader = new ComplexShader;

module.exports = {
	'complex': {
		aliases: ['cgraph'],
		category: 'Image',
		info: 'Calculate a complex value or graph a complex function. Let `i` be the value of `sqrt(-1)`. Pass any constants you may use as flags, ex. `-c:"1+i"`. For graphing, use z as the variable.',
		parameters: ['...function'],
		flags: ['constants...'],
		permissions: 'inclusive',
		fn({client, channelID, arg, args, flags}) {
			let isGraph = arg.indexOf('z') > -1;
			let constants = {};
			flags.forEach((value,key) => {
				constants[key] = Complex.parse(value);
			});
			
			let derive = args[0] == 'derive' || args[0] == 'derivative';
			if (derive) args.shift();
			
			let params = Object.keys(constants);
			if (isGraph) params.unshift('z');
			
			let func = parseComplexFunction(params, args.join(' '));
			if (derive) f.derive();
			
			if (isGraph) {
				let graph = new ComplexGraph(f, constants, {derive});
				// evaluate the complex function at every z on screen
				return client.type(channelID)
				.then(() => graph.render(globalShader))
				.then(image => image.getBufferAs('complex.png'));
			} else {
				// evaluate a complex expression only
				let vals = Object.keys(constants).map(k => constants[k]);
				if (derive) {
					return `Derivative of ${arg} => ${f.derivative(...vals)}`;
				} else {
					return `Value of ${arg} => ${f.evaluate(...vals)}`;
				}
			}
		}
	},
	'fractal': {
		category: 'Image',
		info: 'Renders the iteration of `z_n+1 = f(z_n)` where f(z_n) is a complex function, and displays an iterative explorer. The variable `z` will be used as each pixel coordinate in complex space. By default, the constant `c` is provided as 0+0i, but you can define it and any number of other constants with flags.\nThe first argument may be one of these names for a specific class of fractal:\n`mandelbrot`: render over every c of f(z) where `z0` is the initial value.\n`newton`: render the result of z = z - m*f(z)/f\'(z) where f\' is the first derivative of f, either provided via flag or estimated using a numerical approximation. Modifying `m` to be other than 1 would generate what are called nova fractals.',
		parameters: ['[<mandelbrot|newton>]','[...function]'],
		flags: ['constants...','width','height','offset','zoom','iterations','radius','mode','continuous','derivative','multiplicity'],
		permissions: 'inclusive',
		analytics: false,
		fn({client, context, cmd, args, flags}) {
			let fractal, first = args[0].toLowerCase();
			if (first === 'mandelbrot') {
				args.shift();
				let func = args.join(' ') || undefined;
				fractal  = new Mandelbrot({func});
			} else if (first === 'newton') {
				args.shift();
				let func = args.join(' ') || undefined;
				fractal = new Newton({func});
			} else {
				if (first === 'julia') {
					args.shift();
				}
				let func = args.join(' ');
				if (func.indexOf('z') == -1) {
					throw 'Expression must include `z`';
				}
				fractal = new Fractal({func});
			}
			flags.forEach((value,key) => {
				switch (key) {
					//case 'w':
					case 'width':
						fractal.width = value;
						break;
					//case 'h':
					case 'height':
						fractal.height = value;
						break;
					//case 'o':
					case 'offset':
					case 'center':
					case 'scroll':
						fractal.offset = Complex.parse(value);
						break;
					case 'z':
					case 'zoom':
					case 'scale':
					case 'magnification':
						fractal.zoom = value;
						break;
					//case 'i':
					case 'iterations':
					case 'maxIterations':
					case 'dwell':
					case 'depth':
						fractal.maxIterations = value;
						break;
					//case 'r':
					case 'radius':
					case 'escapeRadius':
						fractal.escapeRadius = value;
						break;
					case 'continuous':
						fractal.continuous = value;
						break;
					case 'aa':
					case 'antialiasing':
						fractal.antiAliasing = value;
						break;
					case 'z0':
					case 'initialz':
					case 'zstart':
						fractal.z0 = Complex.parse(value);
						break;
					case 'mode':
						fractal.renderMode = value;
						break;
					default:
						fractal.constants[key] = Complex.parse(value);
				}
			});
			// create or replace existing explorer
			let explorer = getExplorer(client, context.channelID);
			if (explorer) {
				explorer.fractal = fractal;
			} else {
				explorer = new FractalExplorer(context, fractal, globalShader);
			}
			// render the fractal anew
			return explorer.main(client).then(() => void 0);
		},
		subcommands: {
			'function': {
				aliases: ['func','fn','fz','f'],
				title: 'Fractal | Function',
				info: 'Get or set the fractal\'s iterative function (using the same constants).',
				parameters: ['[expression]'],
				flags: ['c|compiled'],
				fn({client,channelID,arg,flags}) {
					let explorer = getExplorer(client, channelID);
					if (explorer) {
						if (arg) {
							if (flags.has('c') || flags.has('compiled')) {
								throw 'Currently cannot assign javascript to the function. Sorry.';
							}
							explorer.fractal.func = explorer.fractal.func.recompile(arg);
							return explorer.main(client).then(() => void 0);
						} else if (flags.has('c') || flags.has('compiled')) {
							return md.codeblock(explorer.fractal.func.toCompiled(),'js');
						} else {
							return ' = ' + explorer.fractal.func.toSource();
						}
					} else {
						throw arg ? 'Did you intend to create a Fractal first?' : 'Create a Fractal first!';
					}
				}
			},
			'viewport': {
				aliases: ['size','dimensions','s'],
				title: 'Fractal | Viewport',
				info: 'Get or set the viewport width and height.',
				parameters: ['[width]','[height]'],
				fn({client,channelID,args}) {
					let explorer = getExplorer(client, channelID);
					if (explorer) {
						if (args.length) {
							explorer.resize(args[0],args[1]);
							return explorer.main(client).then(() => void 0);
						} else {
							return ' = ' + explorer.fractal.width + 'x' + explorer.fractal.height;
						}
					} else {
						throw 'Create a Fractal first!';
					}
				}
			},
			'offset': {
				aliases: ['center','scroll','o'],
				title: 'Fractal | Offset',
				info: 'Get or set the offset position for rendering. Default is -0.5+0i.',
				parameters: ['[value]'],
				fn({client,channelID,args}) {
					let explorer = getExplorer(client, channelID);
					if (explorer) {
						if (args.length) {
							explorer.fractal.setComplex('offset',args[0],args[1]);
							return explorer.main(client).then(() => void 0);
						} else {
							return ' = ' + explorer.fractal.offset.toString();
						}
					} else {
						throw 'Create a Fractal first!';
					}
				}
			},
			'zoom': {
				aliases: ['magnify','scale','z'],
				title: 'Fractal | Zoom',
				info: 'Get or set the magnification (zoom) for rendering. Default is x150.',
				parameters: ['[factor]','[<in|out>]'],
				fn({client,channelID,args}) {
					let explorer = getExplorer(client, channelID);
					if (explorer) {
						if (args.length && typeof args[0] === 'number') {
							if (args[1] === 'in') {
								explorer.fractal.zoom *= args[0];
							} else if (args[1] === 'out') {
								explorer.fractal.zoom /= args[0];
							} else {
								explorer.fractal.zoom = args[0];
							}
							return explorer.main(client).then(() => void 0);
						} else {
							return ' = x' + explorer.fractal.zoom;
						}
					} else {
						throw 'Create a Fractal first!';
					}
				}
			},
			'constant': {
				aliases: ['const','c'],
				title: 'Fractal | Constant',
				info: 'Get or set a constant in the fractal.',
				parameters: ['constant','[value]'],
				fn({client,channelID,args}) {
					let explorer = getExplorer(client, channelID);
					if (explorer) {
						if (args.length > 1) {
							explorer.fractal.setComplex(args[0],args[1],args[2]);
							return explorer.main(client).then(() => void 0);
						} else {
							let C = explorer.fractal.getComplex(args[0]);
							if (C) {
								return args[0] + ' = ' + C.toString();
							} else {
								throw 'Fractal does not have a constant for ' + args[0];
							}
						}
					} else {
						throw 'Create a Fractal first!';
					}
				}
			},
			'iterations': {
				aliases: ['depth','dwell','limit','max','i'],
				title: 'Fractal | Iterations',
				info: 'Get or set the maximum iterations (aka dwell limit).',
				parameters: ['[value]'],
				fn({client,channelID,args}) {
					let explorer = getExplorer(client, channelID);
					if (explorer) {
						if (args.length && typeof args[0] === 'number') {
							explorer.fractal.maxIterations = args[0];
							return explorer.main(client).then(() => void 0);
						} else {
							return ' = ' + explorer.fractal.maxIterations;
						}
					} else {
						throw 'Create a Fractal first!';
					}
				}
			},
			'escape': {
				aliases: ['radius','r'],
				title: 'Fractal | Escape Radius',
				info: 'Get or set the escape radius condition.',
				parameters: ['[value]'],
				fn({client,channelID,args}) {
					let explorer = getExplorer(client, channelID);
					if (explorer) {
						if (args.length && typeof args[0] === 'number') {
							explorer.fractal.escapeRadius = args[0];
							return explorer.main(client).then(() => void 0);
						} else {
							return ' = ' + explorer.fractal.escapeRadius;
						}
					} else {
						throw 'Create a Fractal first!';
					}
				}
			},
			'mode': {
				aliases: ['rendermode'],
				title: 'Fractal | Render Mode',
				info: 'Get or set the rendering mode.',
				parameters: ['[<boundary|domain|dwell|histogram>]'],
				fn({client,channelID,args}) {
					let explorer = getExplorer(client, channelID);
					if (explorer) {
						if (args.length) {
							if (['domain','dwell','histogram'].includes(args[0])) {
								explorer.fractal.renderMode = args[0];
								return explorer.main(client).then(() => void 0);
							} else {
								throw 'Invalid render mode. Choose `boundary`, `domain`, `dwell`, or `histogram`.';
							}
						} else {
							return ' = ' + explorer.fractal.renderMode;
						}
					} else {
						throw 'Create a Fractal first!';
					}
				}
			},
			'aa': {
				aliases: ['antialiasing'],
				title: 'Fractal | Anti-Aliasing',
				info: 'Get or set anti-aliasing, which affects the resolution quality for chaotic renders.',
				parameters: ['[samples]'],
				fn({client,channelID,args}) {
					let explorer = getExplorer(client, channelID);
					if (explorer) {
						if (args.length && typeof args[0] === 'number') {
							explorer.fractal.antiAliasing = Math.min(Math.max(args[0],1),16);
							return explorer.main(client).then(() => void 0);
						} else {
							return ' = ' + explorer.fractal.continuous;
						}
					} else {
						throw 'Create a Fractal first!';
					}
				}
			},
			'continuous': {
				aliases: ['smoothing','smooth','antibanding'],
				title: 'Fractal | Continuous Shading',
				info: 'Get or set continuous shading, which uses the potential function for interpolating between iterations.',
				parameters: ['[<true|false>]'],
				fn({client,channelID,args}) {
					let explorer = getExplorer(client, channelID);
					if (explorer) {
						if (args.length && typeof args[0] === 'boolean') {
							explorer.fractal.continuous = args[0];
							return explorer.main(client).then(() => void 0);
						} else {
							return ' = ' + explorer.fractal.continuous;
						}
					} else {
						throw 'Create a Fractal first!';
					}
				}
			},
			'reset': {
				aliases: ['init','initial','default'],
				title: 'Fractal | Reset',
				info: 'Resets all rendering options.',
				fn({client,channelID}) {
					let explorer = getExplorer(client, channelID);
					if (explorer) {
						explorer.fractal.reset();
						return explorer.main(client).then(() => void 0);
					} else {
						throw 'Create a fractal first!';
					}
				}
			},
			'return': {
				aliases: ['resetview','origin'],
				title: 'Fractal | Return to Origin',
				info: 'Resets offset and zoom.',
				fn({client,channelID}) {
					let explorer = getExplorer(client, channelID);
					if (explorer) {
						explorer.fractal.resetView();
						explorer.main(client).then(() => void 0);
					} else {
						throw 'Create a fractal first!';
					}
				}
			},
			'redraw': {
				aliases: ['refresh','render','rerender'],
				title: 'Fractal | Redraw',
				info: 'Redraws the fractal.',
				fn({client,channelID}) {
					let explorer = getExplorer(client, channelID);
					if (explorer) {
						explorer.main(client,true).then(() => void 0);
					} else {
						throw 'Create a fractal first!';
					}
				}
			},
			'presets': {
				title: 'Fractal | Presets',
				info: 'Lists stored render presets.',
				parameters: ['[page]'],
				permissions: 'private',
				fn({client,args}) {
					var DATA = client.database.get('client').get(client.id);
					return paginate(DATA.fractalPresets || [], args[0], 20, function (preset,idx) {
						return {
							name: `#${idx+1}`,
							value: JSON.stringify(preset),
							inline: true
						};
					});
				},
				subcommands: {
					'save': {
						title: 'Fractal | Save Preset',
						info: 'Save current render settings as a preset.',
						parameters: ['[index]'],
						fn({client,channelID,args}) {
							let explorer = getExplorer(client, channelID);
							if (explorer) {
								let id = Number(args[0]) - 1;
								let presets = client.storage.fractalPresets || [];
								id = presets[id] ? id : presets.length;
								presets[id] = explorer.fractal.toJSON();
								client.storage = { fractalPresets: presets };
								return `Render settings saved to #${id+1}.`;
							} else {
								throw 'Create a Fractal first!';
							}
						}
					},
					'load': {
						title: 'Fractal | Load Preset',
						info: 'Load an existing render preset.',
						parameters: ['index'],
						fn({client, context, args}) {
							let id = Number(args[0]) - 1;
							let presets = client.storage.fractalPresets || [];
							let data = presets[id];
							if (!data) {
								return `No render preset #${id+1} exists.`;
							}
							
							let fractal;
							if (data.type === 'Mandelbrot') {
								fractal = new Mandelbrot(data);
							} else if (data.type === 'Newton') {
								fractal = new Newton(data);
							} else {
								fractal = new Fractal(data);
							}
							
							let explorer = getExplorer(client, context.channelID);
							if (explorer) {
								explorer.fractal = fractal;
							} else {
								explorer = new FractalExplorer(context, fractal, shader);
							}
							return explorer.main(client).then(() => void 0);
						}
					},
					'erase': {
						aliases: ['delete', 'remove'],
						title: 'Fractal | Erase Preset',
						info: 'Delete a render preset.',
						parameters: ['index'],
						fn({client, args}) {
							let id = Number(args[0]) - 1;
							let presets = client.storage.fractalPresets;
							if (presets) {
								presets.splice(id,1);
								client.storage = {fractalPresets: presets};
							}
							return `Render preset **#${id+1}** deleted.`;
						}
					}
				}
			}
		}
	},
	'mshader': {
		aliases: ['mstyle','mcolors', 'mcolor','fractalshader','fshader','cshader','cstyle','ccolors','complexshader'],
		category: 'Image',
		title: 'Complex Shader',
		info: 'Displays the shader settings for rendering complex graphs and fractals.',
		permissions: 'inclusive',
		fn() {
			return globalShader.toEmbed();
		},
		subcommands: {
			'default': {
				title: 'Complex Shader | Default Color',
				info: 'Gets or sets the default shader color.',
				parameters: ['[color]'],
				fn({args}) {
					if (args.length) {
						globalShader.defaultColor = Color.from(...args);
					}
					return `Default color set to ${globalShader.defaultColor}.`;
				}
			},
			'scale': {
				title: 'Complex Shader | Scale',
				info: 'Gets or sets the scale of the color palette index, which is the iteration values covered per color. Higher value means smoother color transitions.',
				parameters: ['[value]'],
				fn({args}) {
					if (typeof(args[0]) === 'number') {
						globalShader.gradient.scale = args[0];
					}
					return `Scale set to ${globalShader.gradient.scale}.`;
				}
			},
			'reset': {
				title: 'Complex Shader | Reset',
				info: 'Resets the color palette and other shader settings.',
				fn() {
					globalShader.reset();
					return `Color palette and gradient scale set to default.`;
				}
			},
			'random': {
				aliases: ['randomize'],
				title: 'Complex Shader | Randomize',
				info: 'Generates a random color palette and scale. Optionally, specify number of colors to produce.',
				parameters: ['[numcolors]','[scale]'],
				fn({args}) {
					globalShader.gradient.random(Number(args[0])||Math.ceil(10*Math.random()));
					globalShader.gradient.scale = Number(args[1])||(1 + (20 * Math.random()));
					return globalShader.toEmbed();
				}
			},
			'add': {
				title: 'Complex Shader | Add Color',
				info: 'Add a color to the color palette. You can specify a color, otherwise a random one will be made.',
				parameters: ['[color]'],
				fn({args}) {
					let c = args.length ? Color.from(...args) : Color.random();
					globalShader.colors.add(c);
					return `Color added: ${c.toString()}.`;
				}
			},
			'edit': {
				aliases: ['set', 'replace'],
				title: 'Complex Shader | Edit Color',
				info: 'Edit a color given the specified index.',
				parameters: ['index', '...color'],
				fn({args}) {
					let [index,...colArgs] = args;
					let c = globalShader.colors.colors[index-1] = Color.from(...colArgs);
					return `Color #${index} set to ${c.toString()}.`;
				}
			},
			'swap': {
				title: 'Complex Shader | Swap Colors',
				info: 'Exchange the place of two colors by their indices.',
				parameters: ['index1', 'index2'],
				fn({args}) {
					let [i1,i2] = args.map(Number);
					let colors = globalShader.gradient.colors;
					let c = colors[i1-1];
					colors[i1-1] = colors[i2-1];
					colors[i2-1] = c;
					return `Color #${i1} swapped with Color #${i2}.`;
				}
			},
			'remove': {
				title: 'Complex Shader | Remove Color',
				info: 'Remove color at the specified index of the palette.',
				parameters: ['index'],
				fn({args}) {
					let index = Number(args[0]) - 1;
					let c = globalShader.colors[index-1];
					globalShader.colors.splice(index,1);
					return `Color removed: ${c.toString()}.`;
				}
			},
			'clear': {
				title: 'Complex Shader | Remove All Colors',
				info: 'Remove all colors at once to start from a blank palette.',
				fn() {
					globalShader.gradient.clear();
					return 'Shader color palette cleared.';
				}
			},
			'dc': {
				aliases: ['domaincoloring','settings'],
				title: 'Complex Shader | Domain Coloring Settings',
				info: 'Get or set the current settings for domain coloring.',
				parameters: ['[key]','[value]'],
				fn({args}) {
					let settings = globalShader.domainColoringSettings;
					let [key,value] = args;
					if (!key) {
						return Object.keys(settings).map(k => `${k} = ${settings[k]}`).join('\n')
					} else if (key in settings) {
						if (typeof value === typeof settings[key]) {
							settings[key] = value;
						} else {
							value = settings[key];
						}
						return `${key} = ${value}`;
					} else {
						return key + ' is not a setting. Try one of these: ' + Object.keys(settings).join(', ');
					}
				}
			},
			'presets': {
				title: 'Complex Shader | Presets',
				info: 'Lists stored shader presets.',
				parameters: ['[page]'],
				fn({client,args}) {
					let presets = client.storage.fractalShaderPresets || {};
					return paginate(Object.keys(presets), args[0], 20, function (preset,idx) {
						return {
							name: `#${idx+1} - ${preset} - Scale: ${presets[preset].scale}`,
							value: presets[preset].colors.map(c => new Color(c).toString()).join('\n'),
							inline: true
						};
					});
				},
				subcommands: {
					'save': {
						title: 'Complex Shader | Save Preset',
						info: 'Save current shader settings as a preset. ID can be the name or index.',
						parameters: ['id'],
						fn({client,args}) {
							let id = toID(args[0]);
							let presets = client.storage.fractalShaderPresets || {};
							let presetNames = Object.keys(presets);
							if (presetNames[id-1]) {
								id = presetNames[id-1];
							}
							presets[id] = globalShader.toJSON();
							client.storage = {fractalShaderPresets: presets};
							return `Shader data saved to ${id}.`;
						}
					},
					'load': {
						title: 'Complex Shader | Load Preset',
						info: 'Load an existing shader preset. ID can be the name or index.',
						parameters: ['id'],
						fn({client,args}) {
							let id = toID(args[0]);
							let presets = client.storage.fractalShaderPresets || {};
							let presetNames = Object.keys(presets);
							if (presetNames[id-1]) {
								id = presetNames[id-1];
							}
							let data = presets[id];
							if (!data) {
								return `No shader preset ${id} exists.`;
							}
							globalShader.fromJSON(data);
							return `Loaded shader preset ${id}.`;
							
						}
					},
					'erase': {
						aliases: ['delete', 'remove'],
						title: 'Complex Shader | Erase Preset',
						info: 'Delete a shader preset. ID can be the name or index.',
						parameters: ['id'],
						fn({client,args}) {
							let id = toID(args[0]);
							let presets = client.storage.fractalShaderPresets || {};
							let presetNames = Object.keys(presets);
							if (presetNames[id-1]) {
								id = presetNames[id-1];
							}
							delete presets[id];
							client.storage = {fractalShaderPresets: presets};
							return `Shader preset ${id} deleted.`;
						}
					}
				}
			}
		}
	}
};
