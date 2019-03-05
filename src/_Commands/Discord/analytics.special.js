const {DAY} = require('../../Constants/Time');

module.exports = {
    id: 'member-count-analytics',
    category: 'Discord',
    info: 'Records server member counts once per day, up to 100 days, to track growth. This data can then be retrieved to display in a graph.',
    events: {
        tick(client) {
            // check the last tick
			var tick = client.storage.lastGrowthTick || 0,
				now = Date.now();
			if (now - tick >= DAY) {
				// update each server's growth array
				var stable = client.database.get('servers');
				for (let sID in client.servers) {
					stable.modify(sID, data => {
						data.growth = data.growth || [];
						data.growth.push(client.servers[sID].member_count);
						if (data.growth.length > 100) {
							data.growth.shift();
						}
						return data;
					});
				}
				stable.save();
				
				client.storage = {lastGrowthTick: now};
			}
        }
    }
};
