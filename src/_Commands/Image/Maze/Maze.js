const {Jimp,Pointer2D:Cell,Pathfinder,random} = require('../../../Utils');

const WALL = 0x000000FF;
const PASS = 0xFFFFFFFF;
// in case multiple solutions exist
const SOLUTION = [
	0xFF0000FF,0x00FF00FF,0x0000FFFF,
	0x00FFFFFF,0xFF00FFFF,0xFFFF00FF
];

class Maze {
	// https://en.wikipedia.org/wiki/Maze_generation_algorithm#Randomized_Prim's_algorithm
	static generate(width = 101, height = 101, scale = 1) {
		
		// odd dimensions only, so that walls are always on either side of any passage
		if (width  % 2 == 0) width++;
		if (height % 2 == 0) height++;
		
		// 1. Start with a grid full of walls.
		let maze = new Jimp(width, height, WALL);
		
		// 2. Pick a cell, mark it as part of the maze.
		let head = pickRandomCell(), next, walls = [], w, that = this;
		
		function pickRandomCell() {
			let x = 1 + Math.floor(random(width - 1) / 2) * 2;
			let y = 1 + Math.floor(random(height - 1) / 2) * 2;
			return new Cell(x, y, random(4));
		}
		function addWall(cell) {
			if (!that.isPassage(maze,cell) && !that.isBoundary(maze,cell)) walls.push(cell);
		}
		function addWalls(cell) {
			addWall(new Cell(cell.x+1,cell.y,1,0));
			addWall(new Cell(cell.x,cell.y+1,0,1));
			addWall(new Cell(cell.x-1,cell.y,-1,0));
			addWall(new Cell(cell.x,cell.y-1,0,-1));
		}
		function setPassage(maze, cell) {
			return maze.setPixelColor(PASS, cell.x, cell.y);
		}
		function setWall(maze, cell) {
			return maze.setPixelColor(WALL, cell.x, cell.y);
		}
		
		// Add the walls of the cell to the wall list.
		setPassage(maze, head);
		addWalls(head);
		
		// 3. While there are walls in the list: 
		while (walls.length) {
			// Pick a random wall from the list.
			w = random(walls.length);
			head = walls[w];
			walls.splice(w, 1);
			next = head.next();
			
			// If only one of the two cells that the wall divides is visited, then:
			if (that.isPassage(maze,next)) continue;
			
			// Make the wall a passage and mark the unvisited cell as part of the maze.
			setPassage(maze, head);
			setPassage(maze, next);
			
			// Add the neighboring walls of the cell to the wall list.
			addWalls(next);
		}
		
		// Pick two points on the boundary as the entrance and exit
		let entrance = pickRandomCell();
		let exit     = pickRandomCell();
		if (random(2)) {
			entrance.x = 0;
			exit.x     = width - 1;
		} else {
			entrance.y = 0;
			exit.y     = height - 1;
		}
		setPassage(maze, entrance);
		setPassage(maze, exit);
		
		// Upscale the maze
		scale = Math.floor(scale);
		if (scale > 1) {
			maze = maze.scale(scale, Jimp.RESIZE_NEAREST_NEIGHBOR);
		}
		
		return maze;
	}
	// https://en.wikipedia.org/wiki/Maze_solving_algorithm#Recursive_algorithm
	static async solve(maze, scale = 1) {
		if (!(maze instanceof Jimp)) {
			maze = await Jimp.read(maze);
		}
		
		scale = Math.floor(scale);
		if (scale > 1) {
			maze = maze.scale(1/scale);
		}
		
		let exits = this.getExits(maze);
		if (exits.length < 2) {
			return Promise.reject('Maze does not have at least 2 exits/goals.');
		}
		
		// there can be multiple solutions
		let solutions = [], that = this;
		for (let e = 1; e < exits.length; e++) {
			let solution = Pathfinder.route(exits[0], exits[e], {
				map(cell) {
					return that.isPassage(maze,cell) || !that.isWall(maze,cell);
				}
			});
			if (solution) solutions.push(solution);
		}
		if (solutions.length) {
			for (let s = 0; s < solutions.length; s++) {
				let color = this.getColor(maze, solutions[s][solutions[s].length-1]);
				if (color == PASS || color == WALL) color = SOLUTION[s % SOLUTION.length];
				for (let cell of solutions[s]) {
					maze.setPixelColor(color, cell.x, cell.y);
				}
			}
			if (scale > 1) {
				maze = maze.scale(scale, Jimp.RESIZE_NEAREST_NEIGHBOR);
			}
			return maze;
		} else {
			return Promise.reject('Maze has no solution.');
		}
	}
	static getColor(maze, cell) {
		return maze.getPixelColor(cell.x, cell.y);
	}
	static isPassage(maze, cell) {
		return this.getColor(maze,cell) == PASS;
	}
	static isWall(maze, cell) {
		return this.getColor(maze,cell) == WALL;
	}
	static isBoundary(maze, cell) {
		return (cell.x == 0 || cell.x == maze.bitmap.width - 1) || (cell.y == 0 || cell.y == maze.bitmap.height - 1);
	}
	static getExits(maze) {
		let exits = [], x = 0, y = 0, width = maze.bitmap.width, height = maze.bitmap.height, that = this;
		function checkExit(cell) {
			if (!that.isWall(maze,cell)) exits.push(cell);
		}
		for (;x<width-1;x++) checkExit(new Cell(x,y,0,1));
		for (;y<height-1;y++) checkExit(new Cell(x,y,-1,0));
		for (;x>0;x--) checkExit(new Cell(x,y,0,-1));
		for (;y>0;y--) checkExit(new Cell(x,y,0,-1));
		if (!exits.length) {
			console.log('Interesting. No boundary exits. Maybe the exits are different colors?');
			// try looking for goals inside the maze
			let color;
			for (y=0;y<height;y++) {
				for (x=0;x<width;x++) {
					let color = maze.getPixelColor(x,y);
					if (color != WALL && color != PASS) {
						console.log(`Found unique pixel at (${x},${y}) = ${color}`);
						exits.push(new Cell(x,y,0));
					}
				}
			}
		}
		return exits;
	}
}

Maze.PASS = PASS;
Maze.WALL = WALL;

module.exports = Maze;
