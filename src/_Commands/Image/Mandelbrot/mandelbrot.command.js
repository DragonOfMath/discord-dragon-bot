const Mandelbrot = require('./Mandelbrot');
const {Color,ColorGradient,paginate,Jimp} = require('../../../Utils');

const mandelbrot = new Mandelbrot();
const style      = new ColorGradient();

const DEFAULT_STYLE = [Color.RED,Color.YELLOW,Color.GREEN,Color.CYAN,Color.BLUE,Color.MAGENTA];

style.colors = DEFAULT_STYLE;

function random(a,b) {
	return a + (b - a) * Math.random();
}

function toID(x) {
	return typeof(x) === 'string' ? x.toLowerCase().replace(/\s+/g, '_') : x;
}

module.exports = {
	'mset': {
		aliases: ['mandelbrot','fractal'],
		category: 'Image',
		title: 'Mandelbrot Viewer',
		info: 'Renders the current view of the Mandelbrot Set. Optionally, you may specify the width and height of the render (max 2000x2000).',
		parameters: ['[width]','[height]'],
		permissions: 'inclusive',
		fn({client, args, channelID}) {
			var [width,height] = args.map(Number);
			mandelbrot.width  = width  ? Math.max(100, Math.min(width,  2000)) : 600;
			mandelbrot.height = height ? Math.max(100, Math.min(height, 2000)) : 600;
			
			return client.type(channelID)
			.then(() => {
				// mandelbrot -> style -> image
				var start = Date.now();
				
				//style.blend();
				mandelbrot.render();
				
				var image = new Jimp(mandelbrot.width, mandelbrot.height);
				image.scan(0, 0, mandelbrot.width, mandelbrot.height, function (x,y,i) {
					var d = mandelbrot.data[y][x];
					var c = d < (mandelbrot.depth) ? style.get(d / style.scale) : Color.BLACK;
					this.bitmap.data[i+0] = c.r;
					this.bitmap.data[i+1] = c.g;
					this.bitmap.data[i+2] = c.b;
					this.bitmap.data[i+3] = 255;
				});
				var time = Date.now() - start;
				
				return image.getBufferAsync(Jimp.MIME_PNG)
				.then(buffer => {
					return {
						file: buffer,
						filename: `mandelbrot_${Date.now()}.png`,
						message: `Rendered in **${time}ms**`
					};
				});
			});
		},
		subcommands: {
			'reset': {
				aliases: ['init', 'initial', 'default'],
				title: 'Mandelbrot | Reset',
				info: 'Resets all rendering options.',
				fn() {
					mandelbrot.reset();
					return 'Options restored to initial values.';
				}
			},
			'aa': {
				aliases: ['antialiasing', 'smoothing'],
				title: 'Mandelbrot | Anti-Aliasing',
				info: 'Gets or sets anti-aliasing.',
				parameters: ['[boolean]'],
				fn({args}) {
					if (typeof(args[0]) !== 'undefined') {
						mandelbrot.antiAliasing = Boolean(args[0]);
					}
					return `Anti-aliasing set to **${mandelbrot.antiAliasing}**.`;
				}
			},
			'center': {
				aliases: ['goto','position','pos'],
				title: 'Mandelbrot | Center',
				info: 'Gets or sets center viewing position. Use `~` to leave a value unchanged.',
				parameters: ['[real]', '[imaginary]'],
				fn({args}) {
					if (typeof(args[0]) !== 'undefined' && args[0] != '~') {
						mandelbrot.center.x = Number(args[0]);
					}
					if (typeof(args[1]) !== 'undefined' && args[1] != '~') {
						mandelbrot.center.y = Number(args[1]);
					}
					return `Center at **Real = ${mandelbrot.center.x}, Imag = ${mandelbrot.center.y}**.`;
				},
				subcommands: {
					'reset': {
						aliases: ['init', 'initial', 'default'],
						title: 'Mandelbrot | Reset Center',
						info: 'Resets center to (-0.5,0).',
						fn() {
							mandelbrot.center.x = -0.5;
							mandelbrot.center.y = 0;
							return `Center reset to **Real = ${mandelbrot.center.x}, Imag = ${mandelbrot.center.y}**.`;
						}
					},
					'move': {
						aliases: ['change'],
						title: 'Mandelbrot | Move Center',
						info: 'Moves the center viewing position of render by the offset specified. Use `~` to leave a value unchanged. Use the mode `pixels` to move by pixels, and `%` or `percent` to move by percentage of view width.',
						parameters: ['real','imaginary', '[mode]'],
						fn({client, args}) {
							if (typeof(args[2]) !== 'undefined' && args[2] == '-p') {
								mandelbrot.center.x += Number(args[0]) / mandelbrot.zoom;
								mandelbrot.center.y += Number(args[1]) / mandelbrot.zoom;
							} else {
								if (typeof(args[0]) !== 'undefined' && args[0] != '~') {
									mandelbrot.center.x += Number(args[0]);
								}
								if (typeof(args[1]) !== 'undefined' && args[1] != '~') {
									mandelbrot.center.y += Number(args[1]);
								}
							}
							
							return `Center moved to **Real = ${mandelbrot.center.x}, Imag = ${mandelbrot.center.y}**.`;
						}
					},
					'random': {
						title: 'Mandelbrot | Random Center',
						info: 'Moves the center to a random position.',
						fn() {
							mandelbrot.center.x = random(-2.0, 2.0);
							mandelbrot.center.y = random(-1.0, 1.0);
							return `Center moved to **Real = ${mandelbrot.center.x}, Imag = ${mandelbrot.center.y}**.`;
						}
					}
				}
			},
			'k': {
				aliases: ['start'],
				title: 'Mandelbrot | K-Value',
				info: 'Gets or sets the K-value (starting point) of the render. Use `~` to leave a value unchanged.',
				parameters: ['[real]', '[imaginary]'],
				fn({args}) {
					if (typeof(args[0]) !== 'undefined' && args[0] != '~') {
						mandelbrot.kx = Number(args[0]);
					}
					if (typeof(args[1]) !== 'undefined' && args[1] != '~') {
						mandelbrot.ky = Number(args[1]);
					}
					return `K-value set to **Real = ${mandelbrot.kx}, Imag = ${mandelbrot.ky}**.`;
				},
				subcommands: {
					'reset': {
						aliases: ['init', 'initial', 'default'],
						title: 'Mandelbrot | Reset K-Value',
						info: 'Resets K-value to (0,0).',
						fn() {
							mandelbrot.kx = 0;
							mandelbrot.ky = 0;
							return `K-value reset to **Real = ${mandelbrot.kx}, Imag = ${mandelbrot.ky}**.`;
						}
					},
					'random': {
						title: 'Mandelbrot | Random K-Value',
						info: 'Randomizes K-value.',
						fn() {
							mandelbrot.kx = random(-2.0, 2.0);
							mandelbrot.ky = random(-1.0, 1.0);
							return `K-value set to **Real = ${mandelbrot.kx}, Imag = ${mandelbrot.ky}**.`;
						}
					}
				}
			},
			'zoom': {
				aliases: ['mag', 'magnification', 'scale'],
				title: 'Mandelbrot | Zoom',
				info: 'Gets or sets the magnification value.',
				parameters: ['[value]'],
				fn({args}) {
					if (typeof(args[0]) !== 'undefined') {
						mandelbrot.zoom = Number(args[0]);
					}
					return `Magnification set to **x${mandelbrot.zoom}**.`;
				},
				subcommands: {
					'reset': {
						aliases: ['init', 'initial', 'default'],
						title: 'Mandelbrot | Reset Zoom',
						info: 'Resets magnification to x150.',
						fn() {
							mandelbrot.zoom = 150;
							return `Magnification reset to **x${mandelbrot.zoom}**.`;
						}
					},
					'in': {
						aliases: ['enlarge'],
						title: 'Mandelbrot | Zoom In',
						info: 'Multiplies magnification.',
						parameters: ['mult'],
						fn({args}) {
							mandelbrot.zoom *= Number(args[0]);
							return `Magnification set to **x${mandelbrot.zoom}**.`;
						}
					},
					'out': {
						aliases: ['shrink'],
						title: 'Mandelbrot | Zoom Out',
						info: 'Divides magnification.',
						parameters: ['mult'],
						fn({args}) {
							mandelbrot.zoom /= Number(args[0]);
							return `Magnification set to **x${mandelbrot.zoom}**.`;
						}
					}
				}
			},
			'depth': {
				aliases: ['threshold','dwell'],
				title: 'Mandelbrot | Iteration Depth',
				info: 'Gets or sets the iteration depth.',
				parameters: ['[value]'],
				fn({args}) {
					if (typeof(args[0]) !== 'undefined') {
						mandelbrot.depth = Number(args[0]);
					}
					return `Depth set to **${mandelbrot.depth}**.`;
				},
				subcommands: {
					'reset': {
						aliases: ['init', 'initial', 'default'],
						title: 'Mandelbrot | Reset Depth',
						info: 'Resets depth to 48.',
						fn() {
							mandelbrot.depth = 48;
							return `Depth reset to **${mandelbrot.depth}**.`;
						}
					},
					'add': {
						aliases: ['change','increase'],
						title: 'Mandelbrot | Increase Depth',
						info: 'Increases iteration depth by the specified amount, default is 32.',
						parameters: ['[value]'],
						fn({args}) {
							if (typeof(args[0]) !== 'undefined') {
								mandelbrot.depth = Number(args[0]);
							} else {
								mandelbrot.depth += 32;
							}
							return `Depth set to **${mandelbrot.depth}**.`;
						}
					},
					'auto': {
						aliases: ['fix','adjust'],
						title: 'Mandelbrot | Auto-Depth',
						info: 'Auto-adjusts depth to current magnification value.',
						fn() {
							mandelbrot.depth = Math.floor(2 * Math.sqrt(mandelbrot.zoom));
							return `Depth set to **${mandelbrot.depth}** from a zoom level of **${mandelbrot.zoom}**.`;
						}
					}
				}
			},
			'presets': {
				title: 'Mandelbrot | Presets',
				info: 'Lists stored render presets.',
				parameters: ['[page]'],
				fn({client, args}) {
					var DATA = client.database.get('client').get(client.id);
					return paginate(DATA.mSetPresets || [], args[0], 20, function (presets,idx) {
						return {
							name: `#${idx+1}`,
							value: JSON.stringify(presets[idx]),
							inline: true
						};
					});
				},
				subcommands: {
					'save': {
						title: 'Mandelbrot | Save Preset',
						info: 'Save current render settings as a preset.',
						parameters: ['[index]'],
						fn({client, args}) {
							var id = Number(args[0]) - 1;
							client.database.get('client').modify(client.id, DATA => {
								DATA.mSetPresets = DATA.mSetPresets || [];
								id = DATA.mSetPresets[id] ? id : DATA.mSetPresets.length;
								DATA.mSetPresets[id] = {
									x:     mandelbrot.center.x,
									y:     mandelbrot.center.y,
									kx:    mandelbrot.kx,
									ky:    mandelbrot.ky,
									zoom:  mandelbrot.zoom,
									depth: mandelbrot.depth
								};
								return DATA;
							}).save();
							return `Render settings saved to **#${id+1}**.`;
						}
					},
					'load': {
						title: 'Mandelbrot | Load Preset',
						info: 'Load an existing render preset.',
						parameters: ['index'],
						fn({client, args}) {
							var id = Number(args[0]) - 1;
							
							var DATA = client.database.get('client').get(client.id);
							DATA.mSetPresets = DATA.mSetPresets || [];
							var renderData = DATA.mSetPresets[id];
							
							if (typeof(renderData) === 'undefined') {
								return `No render preset **#${id+1}** exists.`;
							}
							
							mandelbrot.center.x = renderData.x;
							mandelbrot.center.y = renderData.y;
							mandelbrot.kx       = renderData.kx;
							mandelbrot.ky       = renderData.ky;
							mandelbrot.zoom     = renderData.zoom;
							mandelbrot.depth    = renderData.depth;
							
							return `Loaded render preset **#${id+1}**.`;
						}
					},
					'erase': {
						aliases: ['delete', 'remove'],
						title: 'Mandelbrot | Erase Preset',
						info: 'Delete a render preset.',
						parameters: ['index'],
						fn({client, args}) {
							var id = Number(args[0]) - 1;
							client.database.get('client').modify(client.id, DATA => {
								DATA.mSetPresets = DATA.mSetPresets || [];
								DATA.mSetPresets.splice(id, 1);
								return DATA;
							}).save();
							return `Render preset **#${id+1}** deleted.`;
						}
					}
				}
			}
		}
	},
	'mshader': {
		aliases: ['mstyle','mcolors', 'mcolor'],
		category: 'Image',
		title: 'Mandelbrot Shader',
		info: 'Displays the shader settings for rendering the Mandelbrot Set.',
		permissions: 'inclusive',
		fn() {
			return style.embed();
		},
		subcommands: {
			'scale': {
				title: 'Mandelbrot Shader | Scale',
				info: 'Gets or sets the scale of the color palette index, which is the iteration values covered per color. Higher value means smoother color transitions.',
				parameters: ['[value]'],
				fn({args}) {
					if (typeof(args[0]) !== 'undefined') {
						style.scale = Number(args[0]);
					}
					return `Scale set to **${style.scale}**.`;
				}
			},
			'reset': {
				title: 'Mandelbrot Shader | Reset',
				info: 'Resets the color palette and other shader settings.',
				fn() {
					style.colors = DEFAULT_STYLE;
					style.scale = 4;
					return `Color palette reset and scale set to **${style.scale}**.`;
				}
			},
			'random': {
				aliases: ['randomize'],
				title: 'Mandelbrot Shader | Randomize',
				info: 'Generates a random color palette and scale. Optionally, specify number of colors to produce.',
				parameters: ['[numcolors]'],
				fn({args}) {
					style.random(Number(args[0])||Math.floor(5+10*Math.random()));
					style.scale = 1 + (20 * Math.random());
					return style.embed();
				}
			},
			'add': {
				title: 'Mandelbrot Shader | Add Color',
				info: 'Add a color to the color palette. If no arguments are provided, a random one is generated.',
				parameters: ['[red]', '[green]', '[blue]'],
				fn({args}) {
					var c = style.add(...args.map(Number));
					return `Color added: **${c.toString()}**.`;
				}
			},
			'edit': {
				aliases: ['set', 'replace'],
				title: 'Mandelbrot Shader | Edit Color',
				info: 'Edit a color given the specified index.',
				parameters: ['index', 'red', 'green', 'blue'],
				fn({args}) {
					var [index,red,green,blue] = args.map(Number);
					var c = style.colors[index-1];
					c.red = red;
					c.green = green;
					c.blue = blue;
					return `Color #${index} set to **${c.toString()}**.`;
				}
			},
			'swap': {
				title: 'Mandelbrot Shader | Swap Colors',
				info: 'Exchange the place of two colors by their indices.',
				parameters: ['index1', 'index2'],
				fn({args}) {
					var [i1,i2] = args.map(Number);
					var c = style.colors[i1-1];
					style.colors[i1-1] = style.colors[i2-1];
					style.colors[i2-1] = c;
					return `**Color #${i1}** swapped with **Color #${i2}**.`;
				}
			},
			'remove': {
				title: 'Mandelbrot Shader | Remove Color',
				info: 'Remove color at the specified index of the palette.',
				parameters: ['index'],
				fn({args}) {
					var i = Number(args[0]) - 1;
					var c = style.colors[i];
					style.colors.splice(i, 1);
					return `Color removed: **${c.toString()}**.`;
				}
			},
			'clear': {
				title: 'Mandelbrot Shader | Remove All Colors',
				info: 'Remove all colors at once to start from a blank palette.',
				fn() {
					style.clear();
					return 'Shader color palette cleared.';
				}
			},
			'preview': {
				title: 'Mandelbrot Shader | Preview Gradient',
				info: 'Displays a gradient of the current color palette.',
				fn({client}) {
					var width = 1000,
						height = 50,
						image = new Jimp(width, height, 0xFFFFFFFF),
						colors = style.colors.length,
						dx = width / colors,
						dy = height / 2,
						x;
					for (x=0;x<colors;x++) {
						image.fill(style.colors[x].rgba, x * dx, 0, dx, dy);
					}
					for (x=0;x<width;++x) {
						image.drawScanY(x, dy, height, style.get(x/dx).rgba);
					}
					return image.getBufferAs('gradient.png');
				}
			},
			'presets': {
				title: 'Mandelbrot Shader | Presets',
				info: 'Lists stored shader presets.',
				parameters: ['[page]'],
				fn({client, args}) {
					var DATA = client.database.get('client').get(client.id);
					DATA.mShaderPresets = DATA.mShaderPresets || {};
					var embed = paginate(Object.keys(DATA.mShaderPresets), args[0], 20, function (presets,idx) {
						var presetName = presets[idx];
						var preset = DATA.mShaderPresets[presetName];
						return {
							name: `#${idx+1} - ${presetName} - Scale: ${preset.scale}`,
							value: preset.colors.map(c => new Color(c).toString()).join('\n'),
							inline: true
						};
					});
					return embed;
				},
				subcommands: {
					'save': {
						title: 'Mandelbrot Shader | Save Preset',
						info: 'Save current shader settings as a preset. ID can be the name or index.',
						parameters: ['id'],
						fn({client, args}) {
							var id = toID(args[0]);
							client.database.get('client').modify(client.id, DATA => {
								DATA.mShaderPresets = DATA.mShaderPresets || {};
								var presets = Object.keys(DATA.mShaderPresets);
								if (typeof(presets[id-1]) !== 'undefined') {
									id = presets[id-1];
								}
								DATA.mShaderPresets[id] = {
									scale:  style.scale,
									colors: style.colors
								};
								return DATA;
							}).save();
							return `Shader data saved to **${id}**.`;
						}
					},
					'load': {
						title: 'Mandelbrot Shader | Load Preset',
						info: 'Load an existing shader preset. ID can be the name or index.',
						parameters: ['id'],
						fn({client, args}) {
							var id = toID(args[0]);
							
							var DATA = client.database.get('client').get(client.id);
							DATA.mShaderPresets = DATA.mShaderPresets || {};
							
							var presets = Object.keys(DATA.mShaderPresets);
							if (typeof(presets[id-1]) !== 'undefined') {
								id = presets[id-1];
							}
							var shaderData = DATA.mShaderPresets[id];
							
							if (typeof(shaderData) === 'undefined') {
								return `No shader preset **${id}** exists.`;
							}
							style.scale = shaderData.scale;
							style.colors = shaderData.colors.map(c => new Color(c));
							
							return `Loaded shader preset **${id}**.`;
						}
					},
					'erase': {
						aliases: ['delete', 'remove'],
						title: 'Mandelbrot Shader | Erase Preset',
						info: 'Delete a shader preset. ID can be the name or index.',
						parameters: ['id'],
						fn({client, args}) {
							var id = toID(args[0]);
							client.database.get('client').modify(client.id, DATA => {
								DATA.mShaderPresets = DATA.mShaderPresets || {};
								var presets = Object.keys(DATA.mShaderPresets);
								if (typeof(presets[id-1]) !== 'undefined') {
									id = presets[id-1];
								}
								delete DATA.mShaderPresets[id];
								return DATA;
							}).save();
							return `Shader preset **${id}** deleted.`;
						}
					}
				}
			}
		}
	}
};
