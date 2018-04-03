const Jimp = require('jimp');
const Mandelbrot = require('./Mandelbrot');
const {Color,ColorGradient} = require('../../Utils');

const mandelbrot = new Mandelbrot();
const style      = new ColorGradient();

const BLACK   = new Color(0,0,0);
const RED     = new Color(0xFF,0,0);
const YELLOW  = new Color(0xFF,0xFF,0);
const GREEN   = new Color(0,0xFF,0);
const CYAN    = new Color(0,0xFF,0xFF);
const BLUE    = new Color(0,0,0xFF);
const MAGENTA = new Color(0xFF,0,0xFF);
const WHITE   = new Color(0xFF,0xFF,0xFF);

const DEFAULT_STYLE = [RED,YELLOW,GREEN,CYAN,BLUE,MAGENTA];

style.colors = DEFAULT_STYLE;

function render() {
	// mandelbrot -> style -> image
	var start = Date.now();
	//style.blend();
	mandelbrot.render();
	var image = new Jimp(mandelbrot.width, mandelbrot.height);
	image.scan(0, 0, mandelbrot.width, mandelbrot.height, function (x,y,i) {
		var d = mandelbrot.data[y][x];
		var c = d < (mandelbrot.depth) ? style.get(d / style.scale) : BLACK;
		this.bitmap.data[i+0] = c.r;
		this.bitmap.data[i+1] = c.g;
		this.bitmap.data[i+2] = c.b;
		this.bitmap.data[i+3] = 255;
	});
	var time = Date.now() - start;
	return { image, time };
}

function random(a,b) {
	return a + (b - a) * Math.random();
}

module.exports = {
	'mset': {
		aliases: ['mandelbrot','fractal'],
		category: 'Fun',
		title: 'Mandelbrot Viewer',
		info: 'Renders the current view of the Mandelbrot Set.',
		fn({client, channelID}) {
			client.simulateTyping(channelID)
			.then(render)
			.then(data => {
				data.image.getBuffer(Jimp.MIME_PNG, (err, buffer) => {
					client.uploadFile({
						to: channelID,
						file: buffer,
						filename: 'mandelbrot.png',
						message: `Rendered in **${data.time}ms**`
					});
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
						info: 'Moves the center viewing position of render by the offset specified. Use `~` to leave a value unchanged. Use `-p` to move by pixels.',
						parameters: ['real','imaginary', '[pixelflag]'],
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
			}
		}
	},
	'mshader': {
		aliases: ['mstyle','mcolors', 'mcolor'],
		category: 'Fun',
		title: 'Mandelbrot Shader',
		info: 'Displays the shader settings for rendering the Mandelbrot Set.',
		fn() {
			return style.toEmbedObject();
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
					return style.toEmbedObject();
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
			'preview': {
				title: 'Mandelbrot Shader | Preview Gradient',
				info: 'Displays a gradient of the current color palette.',
				fn({client, channelID}) {
					var image = new Jimp(1000, 50, 0xFFFFFFFF), c0, c1, x, y;
					var dx = 1000 / style.colors.length;
					for (x=0;x<image.bitmap.width;++x) {
						c0 = style.colors[Math.floor(x/dx)];
						c1 = style.get(x/dx);
						for (y=0;y<25;++y) image.setPixelColor(c0.rgba, x, y);
						for (;y<50;++y)    image.setPixelColor(c1.rgba, x, y);
					}
					image.getBuffer(Jimp.MIME_PNG, (err, buffer) => {
						client.uploadFile({
							to: channelID,
							file: buffer,
							filename: 'gradient.png'
						});
					});
				}
			}
		}
	}
};
