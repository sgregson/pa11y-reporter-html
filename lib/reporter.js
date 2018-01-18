'use strict';

const fs = require('fs');
const hogan = require('hogan.js');
const path = require('path');
const {promisify} = require('util');
const readFile = promisify(fs.readFile);

const report = module.exports = {};

// Pa11y version support
report.supports = '^5.0.0 || ^5.0.0-alpha || ^5.0.0-beta';

// Compile template and output formatted results
report.results = async results => {
	const templateString = await readFile(path.resolve(`${__dirname}/report.html`), 'utf-8');
	const template = hogan.compile(templateString);

	const errors = results.issues.filter(issue => issue.type === 'error');
	const warnings = results.issues.filter(issue => issue.type === 'warning');
	const notices = results.issues.filter(issue => issue.type === 'notice');

	const getFacets = issuesList => {
		return Object.values(issuesList.reduce((acc, issue) => {
			if (!acc[issue.code]) {
				acc[issue.code] = {
					value: 0,
					message: issue.message,
					criteria: issue.code.split(/[.,]/).filter(chunk => chunk.match(/^[A-Z]+\d+$/))
				};
			}

			acc[issue.code].value += 1;
			return acc;
		}, {})
		)
		.sort((firstItem, secondItem) => secondItem.value - firstItem.value);
	};

	return template.render({

		// The current date
		date: new Date(),

		// Result information
		documentTitle: results.documentTitle,
		issues: results.issues.map(issue => {
			issue.typeLabel = upperCaseFirst(issue.type);
			return issue;
		}),
		pageUrl: results.pageUrl,

		// Issue counts
		errorCount: errors.length,
		warningCount: warnings.length,
		noticeCount: notices.length,

		// Issue Types
		errorFacets: getFacets(errors),
		warningFacets: getFacets(warnings),
		noticeFacets: getFacets(notices)

	});
};

// Output error messages
report.error = message => {
	return message;
};

// Utility function to uppercase the first character of a string
function upperCaseFirst(string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}
