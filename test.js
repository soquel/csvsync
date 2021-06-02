var test = require('tape');

var _ = require('lodash');
var csvsync = require('./');

test('csv reading and writing', function(t) {
	var tests = [
		{
			name: 'simple',
			csv: 'foo,bar\n2,3\n4,5\n',
			js: [['foo', 'bar'], ['2', '3'], ['4', '5']],
		},
		{
			name: 'simple',
			csv: 'foo;bar\n2;3\n4;5\n',
			js: [['foo', 'bar'], ['2', '3'], ['4', '5']],
			stringifyOpts: { delimiter: ';' },
			parseOpts: { delimiter: ';' },
		},
		{
			name: 'quotes in field',
			csv: '"Active ""Sum""",bar\n3,2\n4,5\n',
			js: [['Active "Sum"', 'bar'], ['3', '2'], ['4', '5']],
		},
		{
			name: 'empty field in quotes',
			csv: '"",1\n',
			js: [['', '1']],
			stringifyOpts: { quoteEmpty: true },
		},
		{
			name: 'quoted quote at bol',
			csv: '"""",1\n',
			js: [['"', '1']],
		},
		{
			name: 'quoted quote at eol',
			csv: '1,""""\n',
			js: [['1', '"']],
		},
		{
			name: 'quotes in field at end of line',
			csv: '"Active ""Sum""",bar\n3,2\n4,"some ""test"""\n',
			js: [['Active "Sum"', 'bar'], ['3', '2'], ['4', 'some "test"']],
		},
		{
			name: 'whole field in quotes',
			csv: '"""sum""",bar\n3,2\nmore,"""test"""\n',
			js: [['"sum"', 'bar'], ['3', '2'], ['more', '"test"']],
		},
		{
			name: 'field starting with quote and other data',
			csv: '"""sum""",bar\n3,2\n"""test"" a",more\n',
			js: [['"sum"', 'bar'], ['3', '2'], ['"test" a', 'more']],
		},
		{
			name: 'field starting with quote',
			csv: '"""sum""",bar\n3,2\n"""test"" a",more\n',
			js: [['"sum"', 'bar'], ['3', '2'], ['"test" a', 'more']],
		},
		{
			name: 'more than one field starting with quote',
			csv: 'sum,"""spam""","""eggs"""\n3,2,1\n"""test"" a",more,even more\n',
			js: [['sum', '"spam"', '"eggs"'], ['3', '2', '1'], ['"test" a', 'more', 'even more']],
		},
		{
			name: 'comma in field',
			csv: 'sum,bar\n"12,76",2\n4,5\n',
			js: [['sum', 'bar'], ['12,76', '2'], ['4', '5']],
		},
		{
			name: 'newline in a field',
			csv: '"hello\nworld",B1\nsecond line,B2\n',
			js: [['hello\nworld', 'B1'], ['second line', 'B2']],
		},
		{
			name: 'quote everything',
			csv: '"quote","every"\n"""field""","cat\ndog"\n',
			js: [['quote', 'every'], ['"field"', 'cat\ndog']],
			stringifyOpts: { quoteAll: true },
		},
		{
			name: 'preserve both spaces and tabs around fields by default',
			csv: 'foo,bar,baz\n1 \t,\t 2\t , \t3\n',
			js: [['foo', 'bar', 'baz'], ['1 \t', '\t 2\t ', ' \t3']],
		},
	];

	_.each(tests, function(test) {
		// test stringify
		t.deepEqual(
			csvsync.stringify(test.js, test.stringifyOpts),
			test.csv,
			test.name + ' (stringify)',
		);

		// test parse
		t.deepEqual(csvsync.parse(test.csv, test.parseOpts), test.js, test.name + ' (parse)');
	});

	t.end();
});

test('line endings', function(t) {
	var tests = [
		{
			name: 'windows line-endings',
			csv: 'foo,bar\r\n2,3\r\n4,5\r\n',
			js: [['foo', 'bar'], ['2', '3'], ['4', '5']],
		},
		{
			name: 'mac line-endings',
			csv: 'foo,bar\r2,3\r4,5\r',
			js: [['foo', 'bar'], ['2', '3'], ['4', '5']],
		},
		{
			name: 'mixed line-endings',
			csv: 'foo,bar\r\n2,3\r4,5\n',
			js: [['foo', 'bar'], ['2', '3'], ['4', '5']],
		},
		{
			name: 'newline in a field - windows',
			csv: '"hello\r\nworld",B1\r\nsecond line,B2\r\n',
			js: [['hello\nworld', 'B1'], ['second line', 'B2']],
		},
		{
			name: 'newline in a field - mac',
			csv: '"hello\rworld",B1\rsecond line,B2\r',
			js: [['hello\nworld', 'B1'], ['second line', 'B2']],
		},
	];

	_.each(tests, function(test) {
		t.deepEqual(csvsync.parse(test.csv), test.js, test.name);
	});

	t.end();
});

test('using options', function(t) {
	var range = _.map(_.range(1000), function(v) {
		return [v.toString()];
	});

	var tests = [
		{
			name: 'skip header',
			csv: 'foo,bar\n2,3\n4,5\n',
			js: [['2', '3'], ['4', '5']],
			options: { skipHeader: true },
		},
		{
			name: 'trim spaces',
			csv: 'foo,bar\n2, 3\n 4 ,5 \n',
			js: [['foo', 'bar'], ['2', '3'], ['4', '5']],
			options: { trim: true },
		},
		{
			name: 'trim tabs',
			csv: 'foo,bar\n2,\t3\n\t4\t,5\t\n',
			js: [['foo', 'bar'], ['2', '3'], ['4', '5']],
			options: { trim: true },
		},
		{
			name: 'trim spaces and tabs',
			csv: 'foo,bar\n2,\t 3\n \t4 \t,5\t\n',
			js: [['foo', 'bar'], ['2', '3'], ['4', '5']],
			options: { trim: true },
		},
		{
			name: 'preserve spaces and tabs between field chars while trimming',
			csv: 'foo,bar\n2, 3 \t3 \t\n4,5\n',
			js: [['foo', 'bar'], ['2', '3 \t3'], ['4', '5']],
			options: { trim: true },
		},
		{
			name: 'empty fields',
			csv: 'foo,bar\n22,333\n,55555,,7777',
			js: [['22', '333'], ['', '55555', '', '7777']],
			options: { skipHeader: true },
		},
		{
			name: 'empty lines',
			csv: 'foo,bar\n\n22,333\n\n,55555,,7777',
			js: [[''], ['22', '333'], [''], ['', '55555', '', '7777']],
			options: { skipHeader: true },
		},
		{
			name: 'simple',
			csv: 'foo,bar\n2,3\n4,5',
			js: [{ foo: '2', bar: '3' }, { foo: '4', bar: '5' }],
			options: { returnObject: true },
		},
		{
			name: 'handle extra columns not defined in header',
			csv: 'foo,bar,baz\n2,3\n4\n,a,bb,ccc',
			js: [{ bar: '3', foo: '2' }, { foo: '4' }, { bar: 'a', baz: 'bb', foo: '' }],
			options: { returnObject: true },
		},
		{
			name: 'handle empty lines',
			csv: 'foo,bar,baz\n2,3\n\n4\n,a,bb,ccc',
			js: [
				{ bar: '3', foo: '2' },
				{ foo: '' },
				{ foo: '4' },
				{ bar: 'a', baz: 'bb', foo: '' },
			],
			options: { returnObject: true },
		},
		{
			name: 'lines count',
			csv: range.join('\n'),
			js: range,
			options: {},
		},
		{
			name: 'headerKeys usage',
			csv: 'foo,bar\n2,3\n\n4\n,a,bb,ccc',
			js: [
				{ col1: 'foo', col2: 'bar' },
				{ col1: '2', col2: '3' },
				{ col1: '' },
				{ col1: '4' },
				{ col1: '', col2: 'a' },
			],
			options: { returnObject: true, headerKeys: ['col1', 'col2'] },
		},
		{
			name: 'remove field quotes (e.g. to parse unquoted quotes)',
			csv: '"Lorem ipsum dolor","sit "amet" consectetur","adipiscing elit sed"',
			js: [['Lorem ipsum dolor', 'sit "amet" consectetur', 'adipiscing elit sed']],
			options: { removeFieldQuote: '"' },
		},
		{
			name: 'remove field quotes (regex symbol separator)',
			csv:
				'"invoice"|"pos"|"date"\n"000/FV/H/01/2020"|"4"|"2020-01-13"\n"001/FV/H/01/2020"|"5 "6""|"2020-01-14"',
			js: [
				{ invoice: '000/FV/H/01/2020', position: '4', date: '2020-01-13' },
				{ invoice: '001/FV/H/01/2020', position: '5 "6"', date: '2020-01-14' },
			],
			options: {
				skipHeader: true,
				delimiter: '|',
				returnObject: true,
				headerKeys: ['invoice', 'position', 'date'],
				removeFieldQuote: '"',
			},
		},
		{
			name: 'handle quotes in unquoted fields',
			csv: 'abc,"def",g"hi,"jkl,mno\n"pqr,stu,vwx,yz1,234"',
			js: [['abc', '"def"', 'g"hi', '"jkl', 'mno'], ['"pqr', 'stu', 'vwx', 'yz1', '234"']],
			options: { unquotedFields: true },
		},
	];

	_.each(tests, function(test) {
		t.deepEqual(csvsync.parse(test.csv, test.options), test.js, test.name);
	});

	t.end();
});

test('import-export test', function(t) {
	var input, output;
	var obj;

	// create an empty csv with this many rows and columns
	var m = 500;
	var n = 500;
	input = '';

	for (var i = 1; i <= m * n; i++) {
		input = input + i + ',';
		if (i % m === 0) input += '\n';
	}

	obj = csvsync.parse(input);
	output = csvsync.stringify(obj);

	t.equal(input, output, 'big empty array matches after parse ==> stringify cycle');

	// JSON in a field test
	var input_obj = {
		glossary: {
			title: 'example glossary',
			nullfield: null,
			GlossDiv: {
				title: 'S',
				GlossList: {
					GlossEntry: {
						ID: 'SGML',
						SortAs: 'SGML',
						GlossTerm: 'Standard Generalized Markup Language',
						Acronym: 'SGML',
						Abbrev: 'ISO 8879:1986',
						GlossDef: {
							para: 'A meta-markup language',
							GlossSeeAlso: ['GML', 'XML'],
						},
						GlossSee: 'markup',
					},
				},
			},
		},
	};

	input = [['header', 'json'], ['column data', JSON.stringify(input_obj)]];

	csv = csvsync.stringify(input);
	output = csvsync.parse(csv, { returnObject: true });

	// extract the data from 'json' column and parse it
	var output_obj = JSON.parse(output[0].json);

	// compare the input object and parsed output object for complete test
	t.deepEqual(input_obj, output_obj, 'json in field');

	t.end();
});
