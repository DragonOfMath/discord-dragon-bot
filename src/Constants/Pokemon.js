module.exports = {
	HEADER: 'Pokémon:tm:',
	COLOR: 0xFF0000,
	PER_PAGE: 15,
	
	CATCH_COOLDOWN: 2 * 60 * 60 * 1000, // 2 hours
	SCAVENGE_COOLDOWN: 1 * 60 * 60 * 1000, // 1 hour
	TRAIN_COOLDOWN: 30 * 60 * 1000, // 30 minutes
	TRAIN_XP_MIN: 5,  // min XP gained when training
	TRAIN_XP_MAX: 25, // max XP gained when training
	
	BASE_VALUE: 100,
	RARE_BASE_VALUE: 500,
	MYTHICAL_BASE_VALUE: 2500,
	LEGENDARY_BASE_VALUE: 10000,
	
	SHINY_CHANCE: 0.03, // % chance to catch a shiny pokemon
	SHINY_BASE_MULT: 10, // base value multiplier for shinies
	
	TRAINER_TEMPLATE: {
		pokemon: {},
		items: {},
		totalCaught: 0,
		active: 0
	},
	POKEMON_TEMPLATE: {
		n: '',
		s: -1,
		//fav: 0,
		//shiny: 0,
		//lvl: 0,
		xp: 0
	}
};
