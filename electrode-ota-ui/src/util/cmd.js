export const makeArgs = ({platform = 'ios', framework, appName, ...releaseInfo})=> {
	return Object.keys(releaseInfo).filter(key=>releaseInfo[key]).reduce((arr, key)=> {
		arr.push(`--${key}`);
		arr.push(releaseInfo[key]);
		return arr;
	}, [
		appName,
		platform
	]);
};

export default ({makeArgs});
