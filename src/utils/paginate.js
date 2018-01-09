function paginate(items, page, itemsPerPage, callback) {
	itemsPerPage = +itemsPerPage || 20;
	
	var totalItems = items.length || Object.keys(items).length;
	var maxPages = Math.ceil(totalItems / itemsPerPage);
	
	if (typeof(page) !== 'number') {
		page = Number(page);
	}
	if (isNaN(page) || page < 0) {
		page = 1;
	} else {
		page = Math.max(1, Math.min(page, maxPages));
	}
	
	var start = (page - 1) * itemsPerPage;
	var end   = Math.min(start + itemsPerPage, totalItems) - 1;
	
	var embed = {};
	
	if (items.length > 0) {
		embed.fields = [];
		embed.footer = {
			text: `Page ${page} of ${maxPages} | Showing ${start+1}-${end+1} of ${totalItems} Total`
		};
		for (var idx = start, temp; idx <= end; idx++) {
			temp = callback(items, idx);
			if (typeof(temp) === 'string') {
				temp = {
					name: `#${idx+1}`,
					value: temp
				};
			}
			embed.fields.push(temp);
		}
	} else {
		embed.description = 'No items to show.';
	}
	
	return embed;
}

module.exports = {paginate};