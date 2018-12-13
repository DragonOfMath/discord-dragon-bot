const child_process = require('child_process');

class ProcPromise {
	static spawn(command, args, options) {
		return new Promise((resolve, reject) => {
			try {
				// Note: child_process.spawn does not check PATHEXT for command entries
				// Example: even though npm is global, it throws ENOENT error upon spawning
				// https://github.com/nodejs/node-v0.x-archive/issues/5841
				let proc = child_process.spawn(command, args, options);
				proc.stdout.once('error', (e) => {
					proc.error = e;
					proc.kill();
				});
				proc.stderr.once('error', (e) => {
					proc.error = e;
					proc.kill();
				});
				proc.on('exit', (status, signal) => {
					console.log(`Process ${proc.pid} exited with code ${status} (${signal})`);
					if (proc.error) {
						reject(proc.error);
					} else if (proc.stderr && proc.stderr.length) {
						reject(proc.stderr);
					} else {
						resolve(proc.stdout);
					}
				});
			} catch (e) {
				console.error(e);
				//reject(e);
			}
		});
	}
	static spawnSync(command, args, options) {
		return new Promise((resolve, reject) => {
			let {
				pid,
				status,
				signal,
				stdout,
				stderr,
				error
			} = child_process.spawnSync(command, args, options);
			console.log(`Process ${pid} exited with code ${status} (${signal})`);
			if (error) {
				reject(error);
			} else if (stderr.length) {
				reject(stderr);
			} else {
				resolve(stdout);
			}
		});
	}
	static exec(command, args = []) {
		return new Promise((resolve, reject) => {
			child_process.exec([command,...args].join(' '), function (err, stdout, stderr) {
				if (err) {
					reject(err);
				} else if (stderr.length) {
					reject(stderr);
				} else {
					resolve(stdout);
				}
			});
		});
	}
}

module.exports = ProcPromise;
