import {execa} from 'execa';
import fs from 'node:fs/promises';
import fsPath from 'node:path';
import GitHistoryItem from '#lib/gitHistoryItem';
import hashedReleaseName from 'hashed-release-name';
import util from '#lib/util';


export class ChangeLog {

	/**
	* Repo basepath (i.e. this dir will contain a .git directory)
	* @type {String}
	*/
	path;


	/**
	* Mark a repo as about-to-change
	* @returns {Promise<GitHistoryItem>} A promise which resolves with the current Git History state when completed
	*/
	markPreChange() {
		return Promise.resolve()
			.then(()=> this.gitCurrent())
			.then(gitCurrent => fs.writeFile(fsPath.join(this.path, '.git', 'changelog.json'), JSON.stringify({
				created: new Date(),
				preCommit: gitCurrent.hash,
			}, null, '\t'))
				.then(()=> gitCurrent)
			)
	}


	/**
	* Fetch the current commit
	* @returns {Promise<GitHistoryItem>} The current HEAD position within Git
	*/
	gitCurrent() {
		return this.gitHistory({
			limit: 1,
			one: true,
		})
	}


	/**
	* Fetch the GitHistory item of the last mark
	* @returns {Promise<GitHistoryItem>} The last mark (or throw)
	*/
	gitMarked() {
		return fs.readFile(fsPath.join(this.path, '.git', 'changelog.json'))
			.then(content => JSON.parse(content))
			.then(markData => this.gitHistory({
				hash: markData.preCommit,
				one: true,
			}))
	}


	/**
	* Fetch the Git history of a repo
	* @param {Object} [options] Options to specify
	* @param {Boolean} [options.one=false] Return only the first match as an object rather than an array of matches (useful with `hash` to get only one hash
	* @param {String} [options.hash] A specific hash to retrieve
	* @param {String} [options.from] A historical hash to return the history fromo
	* @param {string} [options.to="HEAD"] A hash to return a range of entries too
	* @param {Number} [options.limit=30] The number of rows to return, set to falsy for unlimited
	* @param {Boolean} [options.brief=true] Only show first line of any multi-line commit messages, disabling this returns the raw subject
	* @param {Boolean} [options.merges=false] If falsy, filter out simple Merges - limit may not equal the number of results in this case
	* @returns {Promise<Array<GitHistoryItem>>} A collection of history items matching the above options
	*/
	gitHistory(options) {
		let settings = {
			one: false,
			limit: 30,
			brief: true,
			hash: false,
			from: false,
			to: 'HEAD',
			merges: false,
			...options,
		};
		if (settings.hash) settings.limit = 1;

		return execa('git', [
			'log',
			'--pretty=format:%H|%h|%cI|%cn|%B---END---',
			...(settings.limit
				? [`--max-count=${settings.limit}`]
				: []
			),
			...(
				settings.hash ? [settings.hash]
				: settings.from ? [`${settings.from}..${settings.to}`]
				: []
			),
		], {
			cwd: this.path,
		})
			.then(({stdout}) => stdout.split('---END---')
				.map(line => {
					let segments = line.trim().split('|');

					if (!segments[0]) return; // Last item in list - skip
					if (!settings.merges && /^Merge branch/.test(segments[4])) return; // Filter out merges

					let comment = settings.brief ? segments[4].split('\n', 2)[0] : segments[4];
					let conventional = /^(?<type>\w+?)\s*(?:\((?<scope>.+?)\))?\s*:\s*(?<comment>.*)$/.exec(comment)?.groups;
					if (conventional) {
						conventional.type = conventional.type.toUpperCase();
					}

					return new GitHistoryItem({
						release: hashedReleaseName({
							alliterative: true,
							hash: segments[0],
							transformer: phrase => util.startCase(phrase),
						}),
						hash: segments[0],
						shortHash: segments[1],
						date: new Date(segments[2]),
						committer: segments[3],
						comment,
						conventional,
					});
				})
				.filter(Boolean)
			)
			.then(matches => settings.one ? matches[0] : matches)
	}
}


let changelog = new ChangeLog();
export default changelog;
