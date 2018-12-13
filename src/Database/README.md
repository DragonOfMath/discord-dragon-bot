# Database
My personal Discord Bot uses a local database with premade tables for generic storage. The tables are in JSON format, so they may be opened and altered in any text editor.

Database objects may be retrieved, modified, and deleted using their methods, or one can use a request for more advanced things.

The Database, Table, and Record classes all share common methods: get, set, and delete, plus a few utility methods. The lowercase-style methods perform basic functionality, while the uppercase-style counterparts perform searching through the object tree rather than an immediate property.

## Hierarchy
Databases are folders and Tables are files. Tables are stored in a simple JSON format:

```js
{
    "record1": {
        "field1": "...",
        "field2": {...}
    },
    "record2": {
        "field1": "...",
        "field2": {...},
        "field3": [...]
    },
    ...
}
```

Because records can have arbitrary fields, record schemas are completely optional. You can use a record itself as a schema for other records, in which case you should be careful not to delete it. This structure allows records to be stored, created, and modified without bloat from unused fields.

## Queries
These are the queries you can make on the database, each with multiple ways of invoking:

### GET
Retrieve table(s), record(s), or field(s).

Method Example:
```js
db.GET('users.1234567890.bank.credits');
// Alternatively
db.get('users').get('1234567890').GET('bank.credits');
```

Simple Request Example:
```js
db.request('GET', {
    table: 'users',
    record: '1234567890',
    field: 'bank.credits'
});
```

Advanced Request Example:
```js
db.request('GET', {
    from: 'users',
    where: (id, record) => 'bank' in record,
    select: ['bank.credits'],
    sort: {
        field: 'bank.credits',
        order: 'descending'
    }
});
```

### SET
Set the value of a field(s) or an entire record(s).
Can be used to create new fields/records, or overwrite existing ones.

Note: updates are not saved until an UPDATE request is made.

Method Example:
```js
db.SET({'users.1234567890.bank.credits':1337});
// Alternatively
db.get('users').get('1234567890').SET({'bank.credits':1337});
```

Simple Example:
```js
db.request('SET', {
    table: 'users',
    record: '123467890',
    field: 'bank.credits',
    value: 1337
});
```

Advanced Request Example:
```js
db.request('SET', {
    from: 'users',
    where: (id, record) => 'bank' in record,
    set: {
        'bank.credits': 1337
    }
});
```

### DELETE `data.DELETE(...keys);`
Remove fields from a record, records from a table, or tables from a database.

Method Example:
```js
db.DELETE('users.1234567890.bank.credits');
// Alternatively
db.get('users').get('1234567890').DELETE('bank.credits');
```

Simple Request Example:
```js
db.request('DELETE', {
    table: 'users',
    record: '1234567890',
    field: 'bank.credits'
});
```

Advanced Request Example:
```js
db.request('DELETE', {
    from: 'users',
    where: '134567890',
    select: 'bank.credits'
});
```

### EXPAND `data.EXPAND({key1:value1, ...});`
Append data to all properties of an object.
Add fields to all records of a table simultaneously.

Method Example:
```js
db.get('users').EXPAND({'bank.tax':0.01, 'bank.loan': 1000});
```

### SHRINK `data.SHRINK(...keys);`
Remove data from all properties of an object.
Remove fields from all records of a table simultaneously.

Method Example:
```js
db.get('users').SHRINK('bank.tax', 'bank.loan');
```

### DEFLATE `data.DEFLATE([...keys]);`
Collapse properties into key trails `key1.key2.key3...`.

Arguments are the keys which to deflate. If none are passed, then all keys are deflated.

Method Example:
```js
db.get('users').DEFLATE('1234567890');
```

### INFLATE `data.INFLATE([...keys]);`
Expand properties that are key trails `key1.key2.key3...` into `{key1:{key2:{key3:...}}}`.

Arguments are the keys which to inflate. If none are passed, then all keys are inflated.

Method Example:
```js
db.get('users').INFLATE('1234567890');
```

### UPDATE `data.UPDATE(...tables);`
Save changes to a table.

Method Example:
```js
db.UPDATE('users');
// Alternatively
db.get('users').save();
```

### RELOAD `data.RELOAD(...tables);`
Reload the tables from file.

Method Example:
```js
db.RELOAD('users');
// Alternatively
db.get('users').load();

## See Also
* [SQL Syntax](https://en.wikipedia.org/wiki/SQL_syntax)
