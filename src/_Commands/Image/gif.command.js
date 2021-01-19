const {Jimp,GIF,GifFrame,Math,ThreeDee,ThreeDeeUtils,Geometry,random} = require('../../Utils');
const {processImage} = require('./image-utils');

const PI = Math.PI;
const GIF_SIZE = 150;

function resolvePercent(num, scale = 1, min = 0, max = 100) {
	if (String(num).endsWith('%')) {
		num = Number(num.match(/\d+/));
		num = Math.minmax(num, min, max);
		num /= 100;
		num *= scale;
	}
	return num;
}

module.exports = {
	'gif': {
		category: 'Image',
		info: 'GIF image module.',
		permissions: 'inclusive',
		subcommands: {
			'debug': {
				info: 'Debug a gif by showing the individual frames and delays.',
				parameters: ['[imageURL]'],
				permissions: 'private',
				analytics: false,
				suppress: true,
				fn({client, channelID, args}) {
					return processImage(client, args, channelID, (gif) => {
						return gif.debug().toBuffer();
					}, 'debug.gif');
				}
			},
			'extend': {
				aliases: ['loop','repeat'],
				info: 'Duplicate frames to extend the duration of a short gif.',
				parameters: ['[gifURL]', '[times]'],
				fn({client, channelID, args}) {
					return processImage(client, args, channelID, (gif, times = 1) => {
						if (!(gif instanceof GIF)) {
							throw 'Image must be a GIF!';
						}
						
						if (gif.frames.length < 2) {
							throw 'GIF must have at least 2 frames.';
						}
						
						times = Math.max(1, Math.min(times, 10));
						
						let totalFrames = gif.frames.length * (1 + times);
						if (totalFrames > 255) {
							throw `Output gif will have too many frames (${totalFrames} > 255).`
						}
						
						let frames = gif.frames;
						while (times-- > 0) {
							frames = frames.concat(gif.frames);
						}
						gif.frames = frames;
						
						return gif.toBuffer();
					}, 'extended.gif');
				}
			},
			'spin': {
				aliases: ['roll'],
				info: 'Spin an image! Optionally set how many frames to spin and at what rate (in frames per second). Use a negative speed to spin counter-clockwise.',
				parameters: ['[imageURL]','[frames]','[speed]'],
				fn({client, channelID, args}) {
					return processImage(client, args, channelID, (image, frames = 20, speed = 30) => {
						let dir = 360 * Math.sign(speed);
						let delay = Math.max(2,Math.floor(100 / Math.abs(speed)));
						
						let gif;
						if (image instanceof Jimp) {
							gif = new GIF();
							image = image.circleCrop();
							if (image.bitmap.width > GIF_SIZE) {
								// downsize to reduce network usage
								image = image.resize(GIF_SIZE,Jimp.AUTO);
							}
							for (let f = 0, frame; f < frames; f++) {
								frame = image.clone().rotate(dir * (f / frames), false);
								frame = new GifFrame(frame.bitmap, {delayCentisecs: delay});
								gif.frames.push(frame);
							}
						} else {
							throw 'Image must be a PNG or JPEG!';
						}
						
						//gif.optimizeFrames();
						gif.quantize('dekker');
						return gif.toBuffer();
					}, 'spin.gif');
				}
			},
			'3dspin': {
				aliases: ['spin3d','revolve'],
				info: 'Spin an image in the third dimension! Yaw speed is for rotation along the XZ plane, and pitch speed is for rotation along the YZ plane.',
				parameters: ['[imageURL]','[yawSpeed]','[pitchSpeed]'],
				flags: ['f|fov','d|distance'],
				fn({client, channelID, args, flags}) {
					let fov  = flags.get('fov') || flags.get('f') || 90;
					let dist = flags.get('distance') || flags.get('d') || 2;
					return processImage(client, args, channelID, (image, yawSpeed = 10, pitchSpeed = 0) => {
						let isGif    = image instanceof GIF;
						if (!isGif) image.removeTransparency();
						let width    = isGif ? image.width  : image.bitmap.width;
						let height   = isGif ? image.height : image.bitmap.height;
						let output   = new GIF();
						let frames;
						if (yawSpeed && pitchSpeed) {
							frames = Math.max(Math.floor(360 / yawSpeed), Math.floor(360 / pitchSpeed));
						} else if (yawSpeed) {
							frames = Math.floor(360 / yawSpeed);
						} else if (pitchSpeed) {
							frames = Math.floor(360 / pitchSpeed);
						}
						frames = Math.min(72, frames);
						let plane = Geometry.makePlane(width,height);
						let opts = {zoom:GIF_SIZE*Math.tan(PI*fov/360),distance:GIF_SIZE*dist,width:GIF_SIZE,height:GIF_SIZE,ortho:false};
						for (let f = 0, frame, texture, mat; f < frames; f++) {
							frame = new Jimp(opts.width, opts.height, 0);
							if (isGif) {
								texture = new Jimp(image.frames[f % image.frames.length].bitmap);
								texture.removeTransparency();
							} else {
								texture = image;
							}
							mat = ThreeDee.createMatrix(f * yawSpeed * PI/180, f * pitchSpeed * PI/180);
							frame.renderTris(plane.prerender(mat, opts), texture);
							output.frames.push(new GifFrame(frame.bitmap, {delayCentisecs: 3}));
						}
						output.quantize('dekker');
						return output.toBuffer();
					}, '3dspin.gif');
				}
			},
			'cube': {
				aliases: ['pyramid','icosahedron','dodecahedron','sphere'],
				info: 'G E O M E T R I C A L.',
				parameters: ['[imageURL]','[yawSpeed]','[pitchSpeed]'],
				flags: ['f|fov','d|distance','y|yaw','p|pitch'],
				fn({client, channelID, cmds, args, flags}) {
					let type = cmds[1].toLowerCase();
					let fov   = Number(flags.get('fov')      || flags.get('f')) || 90;
					let dist  = Number(flags.get('distance') || flags.get('d')) || 2;
					let yaw   = Number(flags.get('yaw')      || flags.get('y')) || 0;
					let pitch = Number(flags.get('pitch')    || flags.get('p')) || 0;
					return processImage(client, args, channelID, (image, yawSpeed = 10, pitchSpeed = 5) => {
						let isGif   = image instanceof GIF;
						if (!isGif) image.removeTransparency();
						let output  = new GIF();
						let frames, geo, opts;
						if (yawSpeed && pitchSpeed) {
							frames = Math.max(Math.floor(360 / yawSpeed), Math.floor(360 / pitchSpeed));
						} else if (yawSpeed) {
							frames = Math.floor(360 / yawSpeed);
						} else {
							frames = Math.floor(360 / pitchSpeed);
						}
						frames = Math.min(72, frames);
						switch (type) {
							case 'cube':
								geo = Geometry.makeCube(GIF_SIZE);
								break;
							case 'pyramid':
								geo = Geometry.makePyramid(GIF_SIZE);
								break;
							case 'icosahedron':
								geo = Geometry.makeIcosahedron(GIF_SIZE);
								break;
							case 'dodecahedron':
								geo = Geometry.makeDodecahedron(GIF_SIZE);
								break;
							case 'sphere':
							case 'ball':
								geo = Geometry.makeSphere(GIF_SIZE);
								break;
						}
						opts = {zoom:GIF_SIZE*Math.tan(PI*fov/360),distance:GIF_SIZE*dist,width:GIF_SIZE,height:GIF_SIZE,ortho:false};
						for (let f = 0, ft = 0, g = 0, gt = 0, frame, texture, mat; f < frames; f++, ft+=3) {
							// make a blank render canvas
							frame = new Jimp(opts.width, opts.height, 0);
							// get the texture for the frame
							if (isGif) {
								let delay = image.frames[g].delayCentisecs;
								// preserve gif speed
								if (ft > gt) {
									gt += delay;
									if (g < image.frames.length) {
										g++;
									} else {
										g = 0;
									}
									texture = null;
								} else if (f == 0) {
									gt = delay;
								}
								if (!texture) {
									texture = new Jimp(image.frames[g].bitmap);
									texture.removeTransparency();
								}
							} else {
								texture = image;
							}
							// compute the transformation matrix
							mat = ThreeDee.createMatrix(yaw * PI/180, pitch * PI/180);
							// render the geometry using the texture
							frame.renderTris(geo.prerender(mat, opts), texture);
							// add frame to gif
							output.frames.push(new GifFrame(frame.bitmap, {delayCentisecs: 3}));
							// update rotation
							yaw   += yawSpeed;
							pitch += pitchSpeed;
						}
						output.quantize('dekker');
						return output.toBuffer();
					}, type+'.gif');
				}
			},
			'shake': {
				aliases: ['intensify'],
				info: 'Shake an image or GIF! Optionally, set how "violent" the shaking is as a scale of the image\'s size.',
				parameters: ['[imageURL]','[intensity]'],
				enabled: true,
				fn({client, channelID, args}) {
					return processImage(client, args, channelID, (image, intensity = 0.2) => {
						intensity   = resolvePercent(intensity, 1, 1, 80);
						
						let gif;
						if (image instanceof Jimp) {
							gif = new GIF();
							
							let owidth  = image.bitmap.width;
							let oheight = image.bitmap.height;
							let gwidth  = Math.floor(owidth  * (1 + intensity));
							let gheight = Math.floor(oheight * (1 + intensity));
							let maxOffX = gwidth  - owidth;
							let maxOffY = gheight - oheight;
							
							let baseFrame = new GifFrame(image.bitmap);
							for (let i = 0; i < 8; i++) {
								let frame = new GifFrame(gwidth, gheight, 0, {delayCentisecs: 2});
								let xOffset = Math.floor(maxOffX * Math.random());
								let yOffset = Math.floor(maxOffY * Math.random());
								baseFrame.blit(frame, xOffset, yOffset, 0, 0, owidth, oheight);
								gif.frames.push(frame);
							}
						} else {
							gif = image;
							
							let owidth  = gif.width;
							let oheight = gif.height;
							let gwidth  = Math.floor(owidth  * (1 + intensity));
							let gheight = Math.floor(oheight * (1 + intensity));
							let maxOffX = gwidth  - owidth;
							let maxOffY = gheight - oheight;
							
							for (let frame of gif.frames) {
								let xOffset = Math.floor(maxOffX * Math.random());
								let yOffset = Math.floor(maxOffY * Math.random());
								frame.xOffset = xOffset;
								frame.yOffset = yOffset;
							}
						}
						
						gif.quantize('dekker');
						return gif.toBuffer();
					}, 'shake.gif');
				}
			},
			'reverse': {
				aliases: ['backwards'],
				info: 'Reverse a GIF',
				parameters: ['[gifURL]'],
				enabled: true,
				fn({client, channelID, args}) {
					return processImage(client, args, channelID, (gif) => {
						if (!(gif instanceof GIF)) {
							throw 'Image must be a GIF!';
						}
						
						gif.bakeFrames();
						gif.frames.reverse();
						gif.optimizeFrames();
						
						return gif.toBuffer();
					}, 'reverse.gif');
				}
			},
			'speed': {
				aliases: ['fps','speedup','slowdown'],
				info: 'Speed up (or slow down) a GIF. Specify an FPS or a % of current framerate. Default is 60 fps, 200%, or 50%, depending on which alias you use.',
				parameters: ['[imageURL]','[fps]'],
				enabled: true,
				fn({client, channelID, args, cmds}) {
						return processImage(client, args, channelID, (gif, fps) => {
							if (!(gif instanceof GIF)) {
								throw 'Image must be a GIF!';
							}
							
							if (!fps) {
								switch (cmds[cmds.length-1]) {
									case 'speedup':
										fps = '200%';
										break;
									case 'slowdown':
										fps = '50%';
										break;
									default:
										fps = 60;
										break;
								}
							}
							let isPercentage = String(fps).endsWith('%');
							if (isPercentage) {
								fps = resolvePercent(fps, 1, 1, 1000);
							}
							
							let output = new GIF(), error = 0, delay = 0;
							for (let frame of gif.frames) {
								error += delay = (isPercentage ? frame.delayCentisecs : 100) / fps;
								if (error < 2) continue;
								error -= 2;
								frame.delayCentisecs = Math.max(2,Math.floor(delay));
								output.frames.push(frame);
							}
							
							return output.toBuffer();
						}, 'speedup.gif');
					
				}
			},
			'crop': {
				info: 'Crop a GIF by a rectangular area.',
				parameters: ['[imageURL]','left','top','width','height'],
				enabled: false,
				fn({client, channelID, args}) {
					return processImage(client, args, channelID, (gif,x,y,w,h) => {
						if (!(gif instanceof GIF)) {
							throw 'Image must be a GIF!';
						}
						gif.frames = gif.frames.map(frame => frame.reframe(x,y,w,h));
						return gif.toBuffer();
					}, 'crop.gif');
				}
			},
			'pet': {
				aliases: ['petpet'],
				info: 'Pet someone!',
				parameters: ['user|image'],
				flags: ['fps'],
				enabled: false,
				fn({client, channelID, arg}) {
					let isUser = md.userID(arg);
					let image = isUser ? DiscordUtils.getAvatarURL(isUser) : arg;
					let fps = flags.get('fps') ?? 30;
					return processImage(client, [image], channelID, (image) => {
						if (image instanceof GIF) {
							image = image.frames[0];
						}
						return Jimp.read('petpet.png').then(petpet => {
							let gif = new GIF();
							for (let i = 0, frame; i < 5; i++) {
								frame = new Jimp(112, 112);
								
								gif.frames.push(new GifFrame(frame, {delayCentisecs: Math.floor(100/fps)}));
							}
							return gif;
						});
					}, 'pet.gif');
				}
			},
			'motion': {
				aliases: ['blur','motionblur'],
				info: 'Apply motion blur to a GIF.',
				parameters: ['[gifURL]','[samples]'],
				enabled: false,
				fn({client, channelID, args}) {
					throw 'Work in progress.';
				}
			},
			'corrupt': {
				aliases: ['broken'],
				info: 'Corrupt a GIF',
				parameters: ['[gifURL]'],
				enabled: false,
				fn({client, channelID, args}) {
					throw 'Work in progress.';
				}
			},
			'magik': {
				aliases: ['gmagik'],
				info: 'Apply the magik filter to a GIF.',
				parameters: ['[gifURL]'],
				enabled: false,
				fn({client, channelID, args}) {
					throw 'Work in progress.';
				}
			},
			'caption': {
				aliases: ['text','meme'],
				info: 'Add top and bottom text to the GIF. Use quotation marks for exact texts to put in each, otherwise the bot will try to divide it.',
				parameters: ['[gifURL]','[toptext]','[bottomtext]'],
				enabled: true,
				fn({client, channelID, args}) {
					return processImage(client, args, channelID, async (gif, ...args) => {
						let [toptext,bottomtext] = args;
						if (args.length > 2) {
							m = Math.floor(args.length / 2) + Math.round(2 * (Math.random()-0.5));
							toptext = args.slice(0, m).join(' ');
							bottomtext = args.slice(m).join(' ');
						}
						// default text
						if (!toptext && !bottomtext) {
							toptext = 'YOUR CAPTION GOES HERE';
						}
						
						// calculate positions
						let gwidth = gif.width, gheight = gif.height;
						let topCaption, bottomCaption;
						let font = await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK);
						let padding = 4;
						let captionWidth   = gif.width - 2 * padding;
						let topCaptionY    = 0;
						let centerGifY     = 0;
						let bottomCaptionY = 0;
						let topCaptionHeight = 0;
						let bottomCaptionHeight = 0;
						
						// create the caption parts
						if (toptext) {
							// write the top caption
							topCaption = new Jimp(captionWidth, Jimp.measureTextHeight(font, toptext, captionWidth), 0xFFFFFFFF);
							topCaption.print(font, 0, 0, toptext, captionWidth);
							topCaption = new GifFrame(topCaption.bitmap);
							// adjust gif placement
							topCaptionY = padding;
							topCaptionHeight = topCaption.bitmap.height + padding * 2;
							centerGifY = topCaptionHeight;
						}
						if (bottomtext) {
							bottomCaption = new Jimp(captionWidth, Jimp.measureTextHeight(font, bottomtext, captionWidth), 0xFFFFFFFF);
							bottomCaption.print(font, 0, 0, bottomtext, captionWidth);
							bottomCaption = new GifFrame(bottomCaption.bitmap);
							// adjust gif placement
							bottomCaptionY = topCaptionHeight + gif.height + padding;
							bottomCaptionHeight = bottomCaption.bitmap.height + padding * 2;
						}
						gheight += topCaptionHeight + bottomCaptionHeight;
						
						//console.log('Gif dimensions:',gwidth,gheight);
						//console.log('Gif offset:',centerGifY);
						//console.log('Top caption:',toptext,'@',topCaptionY,'by',topCaptionHeight);
						//console.log('Bottom caption:',bottomtext,'@',bottomCaptionY,'by',bottomCaptionHeight);
						
						let output = new GIF();
						for (let frame of gif.frames) {
							let newFrame = new GifFrame(gwidth, gheight, 0xFFFFFFFF);
							frame.blit(newFrame, 0, centerGifY-1);
							if (topCaption) topCaption.blit(newFrame, padding-1, topCaptionY-1);
							if (bottomCaption) bottomCaption.blit(newFrame, padding-1, bottomCaptionY-1);
							newFrame.delayCentisecs = frame.delayCentisecs;
							output.frames.push(newFrame);
						}
						return output.toBuffer();
					}, "captioned.gif");
				}
			}
		}
	}
};
