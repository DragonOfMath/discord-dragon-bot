const Parser = require('../src/Debugging/DebugParser');

console.log(Parser.createBlock(`test "hello world" 123 {fish};`, true));

console.log(Parser.createBlock(`batch {
	test "Hello World!";
	// This is a test
	fun 123 /* not an argument */ "Testing"; // also a test
	;
	!what.would.this.do { I wonder? } { !who knows }
}`, true));

console.log(Parser.createBlock(`batch {
	mset.aa true;
	// create a new render
	mset.center -1.25066 0.02012;
	mset.zoom 1764600;
	mset.depth 600;
	mset.presets.save
}`, true));

console.log(Parser.createBlock(`
repeat 10 {
	fish;
	wait 5000 {
		batch {
			fish;
			coin 100;
			hmmmm
		};
	};
};
`, true));

console.log(Parser.createBlock(`piet https://example.com/piet.png -t -cs:10 -in:"hello" test`, true));

console.log(Parser.createBlock(`
\`\`\`
 (=<\`#9]~6ZY32Vx/4Rs+0No-&Jk)"Fh}|Bcy?\`=*z]Kw%oG4UUS0/@-ejc(:'8dc
\`\`\`
`, true));

console.log(Parser.createBlock(`expressions %(10 + [] * Math.random()) %[1,2,3,4,"hello",true] %{"key":"value","obj":{}} %/http\\:\\/\\//gi;`, true));
