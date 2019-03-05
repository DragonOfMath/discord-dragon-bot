const Asset = require('../../Structures/Asset');
const {Jimp,strcmp,parseCSV,fetch,encodeURIComponent} = require('../../Utils');

// Stolen off of https://crafting.thedestruc7i0n.ca/ :^) (Images are (c) Mojang)
const Ingredients = Asset.require('Minecraft/ingredients.json');

// Stolen off of https://www.minecraftskinstealer.com/achievement/
const AchievementIcons = Asset.require('Minecraft/achievement_icons.json');

function validateIngredients(ingredients) {
	return parseCSV(ingredients).map(i => {
		if (i.startsWith('minecraft:')) {
			i = i.substring(10);
		}
		if (i in Ingredients) {
			return i;
		}
		for (var id in Ingredients) {
			if (strcmp(i,Ingredients[id].name)) {
				return id;
			}
		}
		return '';
	});
}
function loadIngredient(i) {
	return Jimp.readAsDataURL(Ingredients[i].image);
}
async function placeIngredient(template, ingredient, x, y) {
	let ii = await loadIngredient(ingredient);
	
	// center ingredient inside slot
	x += -0.5 * ii.bitmap.width;
	y += -0.5 * ii.bitmap.height;
	
	template.composite(ii, x, y);
}
async function generateCraftingRecipe(ingredients, output) {
	let table = await Jimp.read(Asset.load('Minecraft/crafting.png'));
	for (let y = 0; y < 3; y++) {
		for (let x = 0; x < 3; x++) {
			let i = 3 * y + x;
			if (ingredients[i]) await placeIngredient(table, ingredients[i], 28+36*x, 50+36*y);
		}
	}
	if (output) await placeIngredient(table, output, 216, 76);
	return table.getBufferAs('recipe.png');
}
async function generateFurnaceRecipe(input, fuel, output) {
	let furnace = await Jimp.read(Asset.load('Minecraft/furnace.png'));
	if (input)  await placeIngredient(furnace, input,   78,  50);
	if (fuel)   await placeIngredient(furnace, fuel,    78, 123);
	if (output) await placeIngredient(furnace, output, 216,  76)
	return furnace.getBufferAs('recipe.png');
}

module.exports = {
	'mc': {
		aliases: ['minecraft','meinkraft'],
		category: 'Image',
		title: 'Minecraft',
		info: 'Minecraft-related image commands.',
		permissions: 'inclusive',
		subcommands: {
			'craft': {
				aliases: ['crafting','table'],
				title: 'Minecraft | Crafting Recipe',
				info: 'Generates a Minecraft crafting recipe. Ingredients are minecraft:identifers or block names, and separated by commas. Empty slots can be any non-valid identifer. To set the output, use 10 ingredients with the output as the last.',
				parameters: ['...ingredients'],
				fn({args}) {
					let ingredients = validateIngredients(args), output;
					if (ingredients.length == 10) {
						output = ingredients.pop();
					}
					return generateCraftingRecipe(ingredients, output);
				}
			},
			'furnace': {
				aliases: ['cooking'],
				title: 'Minecraft | Furnace Recipe',
				info: 'Generates a Minecraft furnace recipe. Ingredients are minecraft:identifiers or block names, and separated by commas.',
				parameters: ['input','fuel','output'],
				fn({args}) {
					let [input,fuel,output] = validateIngredients(args);
					return generateFurnaceRecipe(input, fuel, output);
				}
			},
			'achievement': {
				aliases: ['achvmnt','ag'],
				title: 'Minecraft | Achievement',
				info: 'Generates a Minecraft achievement.',
				parameters: ['text'],
				flags: ['title','icon'],
				fn({arg,flags}) {
					let text  = arg;
					let title = flags.has('title') ? flags.get('title') : 'Achievement Get!';
					let icon  = flags.has('icon') ? flags.get('icon') : 1;
					if (typeof(icon) === 'string') {
						icon = AchievementIcons[icon.toLowerCase()];
					}
					if (typeof(icon) === 'undefined') {
						icon = 1;
					}
					//console.log(title, text, icon);
					return fetch(`https://www.minecraftskinstealer.com/achievement/a.php?i=${icon}&h=${title}&t=${text}`, {encoding:null})
					.then(file => ({file,filename:'achievement.png'}));
				}
			}
		}
	}
};
