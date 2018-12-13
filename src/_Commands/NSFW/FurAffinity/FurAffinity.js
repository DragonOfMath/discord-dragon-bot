const Submission = require('./Submission');
const Profile    = require('./Profile');
const Journal    = require('./Journal');
const ContentViewer = require('./ContentViewer'); // for submissions
const TextViewer    = require('./TextViewer'); // for journals/comments

const COLOR = 0x2e3b41;

module.exports = {
	COLOR,
	Submission,
	Profile,
	Journal,
	ContentViewer,
	TextViewer
};
