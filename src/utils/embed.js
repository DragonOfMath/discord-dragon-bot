function tableify(columns = [], rows = [], fn, start = 0, limit) {
	if ((columns.length > 3 && columns.length % 3 !== 0) || columns.length > 24) {
		throw '# of columns must be a multiple of 3 and not be more than 24.';
	}
	if (!limit) limit = rows.length;
	
	let end = Math.min(start + limit, rows.length) - 1;
	let fields = columns.map(name => ({
		name,
		value: '',
		inline: true
	}));
	for (let r = start, row; r <= end; r++) {
		row = fn ? fn(rows[r], r) : rows[r];
		for (let c = 0; c < row.length; c++) {
			fields[c].value += String(row[c]) + '\n';
		}
	}
	
	let embed = {fields};
	if (start != 1 || end != rows.length) {
		embed.footer = {
			text: `Showing ${start+1}-${end+1} of ${rows.length} Total`
		};
	}
	return embed;
}

function paginate(items, page = 1, limit = 20, fn) {
	page  = +page;
	limit = +limit;
	
	let totalItems = items.length || Object.keys(items).length;
	let maxPages = Math.ceil(totalItems / limit);
	
	if (isNaN(page) || page < 1) {
		page = 1;
	} else {
		page = Math.min(page, maxPages);
	}
	
	let start = (page - 1) * limit;
	let end   = Math.min(start + limit, totalItems) - 1;
	
	let embed = {};
	
	if (items.length > 0) {
		embed.fields = [];
		embed.footer = {
			text: `Page ${page} of ${maxPages} | Showing ${start+1}-${end+1} of ${totalItems} Total`
		};
		for (var idx = start, temp; idx <= end; idx++) {
			temp = fn(items, idx, items[idx]);
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

/**
 * Paginate but put multiple items under each field, up to a given limit or until the field size limit is reached.
 */
function bufferize(items, page = 1, itemsPerField = 25, itemsPerPage = 100, delimiter = '\n', map) {
	page          = +page;
	itemsPerField = +itemsPerField;
	pageLimit     = +itemsPerPage;
	
	let totalItems = items.length || Object.keys(items).length;
	let maxPages   = Math.ceil(totalItems / itemsPerPage);
	
	if (isNaN(page) || page < 1) {
		page = 1;
	} else {
		page = Math.min(page, maxPages);
	}
	
	let pageStart = (page - 1) * itemsPerPage;
	let pageEnd   = Math.min(pageStart + itemsPerPage, totalItems) - 1;
	let embed = {
		fields: [],
		footer: {text:`Page ${page} of ${maxPages} | Showing ${pageStart+1}-${pageEnd+1} of ${totalItems} Total`}
	};
	
	let start, end, item, buffer = '', itemsInBuffer = 0, idx;
	for (start = pageStart,
	     end  = start + itemsPerField,
		 idx = start,
		 item; idx <= pageEnd; idx++) {
		if (itemsInBuffer == itemsPerField || (buffer.length + items[idx].length) > 1000) {
			end = idx;
			embed.fields.push({
				name: `${start+1}-${end}`,
				value: buffer,
				inline: true
			});
			start = end;
			buffer = '';
			itemsInBuffer = 0;
		}
		item = items[idx];
		if (map) item = map(item, idx, items);
		buffer += item + delimiter;
		itemsInBuffer++;
	}
	if (buffer) {
		end = idx;
		embed.fields.push({
			name: `${start+1}-${end}`,
			value: buffer,
			inline: true
		});
	}
	return embed;
}

module.exports = {paginate,tableify,bufferize};
