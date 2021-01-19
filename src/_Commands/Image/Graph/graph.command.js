const Graph = require('./Graph');

module.exports = {
	'graph': {
		aliases: ['chart','graphing'],
		category: 'Image',
		title: 'Data Graph',
		info: 'Graph some data. Flags: image `w`idth, image `h`eight, graph `t`itle, `x`-axis label, `y`-axis label, draw all 4 `b`orders, draw `o`rigin, draw `g`rid',
		permissions: 'inclusive',
		parameters: ['<line|scatter|bar|pie>', '...(x,y)'],
		flags: ['w|width','h|height','t|title','x|xaxis','y|yaxis','b|borders','o|origin','g|grid'],
		fn({client, args, flags}) {
			let [type, ...data] = args;
			
			let tuples = data.join(' ').match(/\(([^,]+),([0-9.-]+)\)/g);
			if (tuples) {
				data = tuples.map(tuple => {
					tuple = tuple.match(/^\(([^,]+),([0-9.-]+)\)$/).slice(1);
					return [tuple[0],Number(tuple[1])];
				});
			} else {
				data = data.map((value,i) => {
					return [i,Number(value)];
				});
			}
			
			let options = {};
			options.type     = type.toLowerCase();
			options.width    = flags.get('w') || flags.get('width');
			options.height   = flags.get('h') || flags.get('height');
			options.title    = flags.get('t') || flags.get('title');
			options.xaxis    = flags.get('x') || flags.get('xaxis');
			options.yaxis    = flags.get('y') || flags.get('yaxis');
			options.borders  = flags.get('b') || flags.get('borders');
			options.origin   = flags.get('o') || flags.get('origin');
			options.grid     = flags.get('g') || flags.get('grid');
			
			let graph, graphName;
			switch (options.type) {
				case 'line':
					graph = Graph.createLineGraph(data, options).image;
					graphName = 'linegraph.png';
					break;
				case 'scatter':
					graph = Graph.createScatterGraph(data, options).image;
					graphName = 'scatterplot.png';
					break;
				case 'bar':
					graph = Graph.createBarGraph(data, options).image;
					graphName = 'bargraph.png';
					break;
				case 'pie':
					graph = Graph.createPieChart(data, options).image;
					graphName = 'piechart.png';
					break;
			}
			if (client.DARK_MODE) graph = graph.invert();
			return graph.getBufferAs(graphName);
		}
	}
};
