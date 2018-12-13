const Maze = require('../src/_Commands/Image/Maze');

Maze.solve(__dirname + '/maze.png').then(mazeImage => {
	mazeImage.write(__dirname + '/maze-solution.png');
});
