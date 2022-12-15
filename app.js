#!/usr/bin/node

import chalk from 'chalk';
import changelog from '#lib/changelog';
import {program, Command} from 'commander';

program
	.name('changelog')
	// subcmd meta: intialize changelog {{{
	.hook('preAction', rawOptions => {
		let options = rawOptions.opts();
		// Initalize the path of the changelog instance if we have one {{{
		changelog.path = options.path || process.cwd();
		// }}}
	})
	// }}}
	// subcmd: mark {{{
	.addCommand(new Command()
		.command('mark')
		.description('Mark a repo as about-to-be-deployed')
		.action(()=>
			changelog.markPreChange()
				.then(gitHead => console.log(
					'Repo marked for pre-deploy from',
					chalk.cyan(gitHead.shortHash),
					chalk.blue(`"${gitHead.release}"`),
				))
		)
	)
	// }}}
	// subcmd: marked {{{
	.addCommand(new Command()
		.command('marked')
		.description('Show the last mark position')
		.action(()=>
			changelog.gitMarked()
				.then(gitMarked => console.log(gitMarked))
		)
	)
	// }}}
	// subcmd: generate {{{
	.addCommand(new Command()
		.command('generate')
		.description('Generate contents suitable for a CHANGELOG.md file')
		.option('--from <hash>', 'Override the last-marked hash')
		.action(options => Promise.resolve()
			.then(()=> Promise.all([
				changelog.gitCurrent(),
				options.from
					? changelog.gitHistory({
						hash: options.from,
						one: true
					})
					: changelog.gitMarked(),
			]))
			.then(([current, marked]) => changelog.gitHistory({
				from: marked.hash,
				to: current.hash
			}))
			.then(history => history.forEach(item => console.log(item.toDigest())))
		)
	)
	// }}}
	.option('-p, --path <repo-base>', 'Specify the repo base (defaults to PWD)')
	.option('-v, --verbose', 'Be verbose (also prints a running total if -c is specified)')
	.option('--no-color', 'Force disable color')
	.parse(process.argv);
