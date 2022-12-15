export default class GitHistoryItem {
	// Simple fields {{{
	/**
	* Long-form hash of the current item
	* @type {String}
	*/
	hash;


	/**
	* Short-form hash of the current item
	* @type {String}
	*/
	shortHash;


	/**
	* The human-readable release name for history item
	* @type {String}
	*/
	release;


	/**
	* The date of the history item
	* @type {Date}
	*/
	date;


	/**
	* The committer details for the history item
	* @type {String}
	*/
	committer;


	/**
	* The history item comment
	* @type {String}
	*/
	comment;


	/**
	* Conventional commit breakdown
	* @see https://www.conventionalcommits.org/en/v1.0.0/#summary
	* @type {Object}
	* @property {String} type The type of conentional commit
	* @property {String} [scope] Optional scope associated with the commit
	* @property {String} [scopeUrl] Optional scope URL
	* @property {String} comment The single line comment of the commit
	*/
	// }}}

	// Constructor {{{
	/**
	* Initalize and set various attributes
	* @param {Object} [attrs] Attributes to set
	*/
	constructor(attrs) {
		if (attrs) {
			['hash', 'shortHash', 'release', 'date', 'committer', 'comment', 'conventional']
				.filter(k => attrs[k]) // Has a value
				.forEach(k => this[k] = attrs[k])
		}
	}
	// }}}

	// toDigest() {{{
	toDigest() {
		if (this.conventional) {
			return [
				this.conventional.type,
				...(
					this.conventional.scope && this.conventional.scopeUrl ? [`(${this.conventional.scope}[${this.conventional.scopeLink}])`]
					: this.conventional.scope ? [`(${this.conventional.scope})`]
					: []
				),
				': ',
				this.conventional.comment,
			].join('')
		} else {
			return this.comment;
		}
	}
	// }}}
}
