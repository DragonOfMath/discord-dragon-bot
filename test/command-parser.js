const Parser = require('../src/Parser');

console.log(Parser.parseCommand(`
	!test "hello world" 123 {!fish};
`));

console.log(Parser.parseCommand(`
!batch {
	!test "Hello World!";
	// This is a test
	!fun 123 /* not an argument */ "Testing"; // also a test
	;
	!what.would.this.do { I wonder? } { !who knows }
}
`));

console.log(Parser.parseCommand(`
!batch {
	!mset.aa true;
	// create a new render
	!mset.center -1.25066 0.02012;
	!mset.zoom 1764600;
	!mset.depth 600;
	!mset.presets.save
}
`));

console.log(Parser.parseCommand(`
!repeat 10 {
	!fish;
	!wait 5000 {
		!batch {
			!fish;
			!coin 100;
			hmmmm
		};
	};
};
`));
