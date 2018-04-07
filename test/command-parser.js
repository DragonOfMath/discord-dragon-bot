const CommandParser = require('../src/CommandParser');

console.log(CommandParser.parse(`
	!test "hello world" 123 ;;;
	yes
	!nope {nope};
`));

console.log(CommandParser.parse(`
!batch {
	!test "Hello World!";
	// This is a test
	!fun 123 /* not an argument */ "Testing"; // also a test
	;
	!what.would.this.do { I wonder? } { !who knows }
}
`));

console.log(CommandParser.parse(`
!batch {
	!mset.aa true;
	// create a new render
	!mset.center -1.25066 0.02012;
	!mset.zoom 1764600;
	!mset.depth 600;
	!mset.presets.save
}
`));

console.log(CommandParser.parse(`
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
