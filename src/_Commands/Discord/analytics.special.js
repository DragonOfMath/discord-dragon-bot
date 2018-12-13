const DAY = 86400000;

module.exports = {
    id: 'member-count-analytics',
    category: 'Discord',
    info: 'Records server member counts once per day, up to 100 days, to track growth. This data can then be retrieved to display in a graph.',
    events: {
        tick(client) {
            // check the last tick
            let now = Date.now();
            let clientTable = client.database.get('client');
            let clientData = clientTable.get(client.id);
            if (now - (clientData.lastGrowthTick||0) < DAY) return;
            clientData.lastGrowthTick = now;
            clientTable.set(client.id, clientData).save();

            // update the table when that special tick comes
            let serverTable = client.database.get('servers');
            for (let serverID in client.servers) {
                serverTable.modify(serverID, data => {
                    data.growth = data.growth || [];
                    data.growth.push(client.servers[serverID].member_count);
                    if (data.growth.length > 100) {
                        data.growth.shift();
                    }
                    return data;
                });
            }
            serverTable.save();
        }
    }
};
