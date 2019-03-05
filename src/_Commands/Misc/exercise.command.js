const Asset = require('../../Structures/Asset');
const {Markdown:md,Format:fmt,random} = require('../../Utils');

const Exercises = Asset.require('Fitness/exercises.json');

class Exercise {
	constructor(o) {
		this.name   = o.name;
		this.type   = o.type;
		this.amount = o.amount;
		this.weight = o.weight;
	}
	toString(difficulty = 1) {
		if (this.type == 'set') {
			return md.bold(fmt.plural('set',difficulty)) + ' of ' + md.bold(this.amount) + ' ' + md.bold(this.name);
		} else {
			return md.bold(this.name) + ' for ' + md.bold(fmt.time(1000 * this.amount * difficulty));
		}
	}
}
class ExerciseRoutine {
	constructor() {
		this.exs = {};
		this.weight = 0;
	}
	add(ex) {
		if (ex.name in this.exs) {
			this.exs[ex.name].amount += ex.amount;
		} else {
			this.exs[ex.name] = new Exercise(ex);
		}
		this.weight += ex.weight;
	}
	toString() {
		let str = '';
		for (let ex in this.exs) {
			str += this.exs[ex].toString() + '\n';
		}
		return str;
	}
	static generate(muscle, difficulty = 1) {
		let totalWeight = 0.5 * (1 + difficulty);
		let exercises = new ExerciseRoutine();
		while (exercises.weight < totalWeight) {
			exercises.add(random(Exercises[muscle]));
		}
		return exercises;
	}
}

module.exports = {
	'exercise': {
		title: 'Exercise Routine',
		info: 'Get a random full exercise routine. You can select a difficulty from 1 to 10.',
		parameters: ['[difficulty]'],
		permissions: 'inclusive',
		analytics: false,
		fn({client,args}) {
			let difficulty = Math.min(Math.max(1, args[0] || 1), 10),
			    routine = {
					fields: [],
					thumbnail: {
						url: 'https://darebee.com/images/posters/bodyweight-exercises-chart.jpg'
					}
				};
			
			for (let muscle in Exercises) {
				routine.fields.push({
					name: muscle,
					value: ExerciseRoutine.generate(muscle, difficulty).toString()
				});
			}
			return routine;
		},
		subcommands: {
			'abs': {
				aliases: ['abdomen','core'],
				title: 'Random Exercise: Abs',
				info: 'Get a random exercise for the abs.',
				parameters: ['[difficulty]'],
				analytics: false,
				fn({client,args}) {
					let difficulty = Math.min(Math.max(1, args[0] || 1), 10);
					return ExerciseRoutine.generate('abs', difficulty).toString();
				}
			},
			'quads': {
				aliases: ['quadriceps','upperleg'],
				title: 'Random Exercise: Quads',
				info: 'Get a random exercise for the quads.',
				parameters: ['[difficulty]'],
				analytics: false,
				fn({client,args}) {
					let difficulty = Math.min(Math.max(1, args[0] || 1), 10);
					return ExerciseRoutine.generate('quads', difficulty).toString();
				}
			},
			'glutes': {
				aliases: ['gluteus','lowerback'],
				title: 'Random Exercise: Glutes',
				info: 'Get a random exercise for the glutes.',
				parameters: ['[difficulty]'],
				analytics: false,
				fn({client,args}) {
					let difficulty = Math.min(Math.max(1, args[0] || 1), 10);
					return ExerciseRoutine.generate('glutes', difficulty).toString();
				}
			},
			'tris': {
				aliases: ['triceps','upperarm'],
				title: 'Random Exercise: Triceps',
				info: 'Get a random exercise for the triceps.',
				parameters: ['[difficulty]'],
				analytics: false,
				fn({client,args}) {
					let difficulty = Math.min(Math.max(1, args[0] || 1), 10);
					return ExerciseRoutine.generate('triceps', difficulty).toString();
				}
			},
			'bis': {
				aliases: ['biceps','lowerarm'],
				title: 'Random Exercise: Biceps',
				info: 'Get a random exercise for the biceps.',
				parameters: ['[difficulty]'],
				analytics: false,
				fn({client,args}) {
					let difficulty = Math.min(Math.max(1, args[0] || 1), 10);
					return ExerciseRoutine.generate('biceps', difficulty).toString();
				}
			},
			'back': {
				aliases: [],
				title: 'Random Exercise: Back',
				info: 'Get a random exercise for the back.',
				parameters: ['[difficulty]'],
				analytics: false,
				fn({client,args}) {
					let difficulty = Math.min(Math.max(1, args[0] || 1), 10);
					return ExerciseRoutine.generate('back', difficulty).toString();
				}
			},
			'chest': {
				aliases: ['uppercore'],
				title: 'Random Exercise: Chest',
				info: 'Get a random exercise for the chest.',
				parameters: ['[difficulty]'],
				analytics: false,
				fn({client,args}) {
					let difficulty = Math.min(Math.max(1, args[0] || 1), 10);
					return ExerciseRoutine.generate('chest', difficulty).toString();
				}
			},
			
		}
	}
};
