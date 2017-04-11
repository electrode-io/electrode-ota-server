module.exports.releaseReact = ({token, host}, releaseDir, args, reporter = exports.console)=>
	Promise.resolve({
		noExec: `
$ cd your-project-dir
$ code-push login --accessKey ${token} ${host}
$ code-push ${args.join(' ')} 
`
	});
