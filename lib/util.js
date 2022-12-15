export function startCase(str) {
	return str
		.split(/\s+/)
		.map(word => word[0].toUpperCase() + word.substring(1).toLowerCase())
		.join(' ');
}

export default {
	startCase,
}
