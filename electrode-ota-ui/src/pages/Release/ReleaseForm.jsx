import React from 'react';
import Form from '../../components/BusyErrorForm';

const schema = {
	schema: {
		framework: {
			type: 'Select',
			validators: ['required'],
			options: [{label: 'React', val: 'releaseReact'}, {label: 'Cordova', val: 'releaseCordova'}]

		},
		targetBinaryVersion: {
			help: 'Semver expression that specifies the binary app version(s) this release is targeting (e.g. 1.1.0, ~1.2.3). If omitted, the release will target the exact version specified in the "Info.plist" (iOS), "build.gradle" (Android) or "Package.appxmanifest" (Windows) files.'
		},

		platform: {
			type: 'Select',
			validators: ['required'],
			options: ['ios', 'android', 'windows']
		},
		build: {
			type: 'Checkbox',
			help: 'Invoke "cordova build" instead of "cordova prepare"'
		},
		bundleName: {
			type: 'Text',
			help: 'Name of the generated JS bundle file. If unspecified, the standard bundle name will be used, depending on the specified platform: "main.jsbundle" (iOS), "index.android.bundle" (Android) or "index.windows.bundle" (Windows)'
		},
		description: {
			type: 'TextArea',
			help: 'Description of the changes made to the app with this release'
		},
		development: {
			type: 'Checkbox',
			help: 'Specifies whether to generate a dev or release build',
			fieldClass:'form-group checkbox-field'
		},
		disabled: {
			type: 'Checkbox',
			help: 'Specifies whether this release should be immediately downloadable',
			fieldClass:'form-group checkbox-field'
		},
		gradleFile: {
			type: 'FilePath',
			help: 'Path to the gradle file which specifies the binary version you want to target this release at (android only).'
		},
		mandatory: {
			type: 'Checkbox',
			help: 'Specifies whether this release should be considered mandatory',
			fieldClass:'form-group checkbox-field'
		},
		plistFile: {
			type: 'FilePath',
			help: 'Path to the plist file which specifies the binary version you want to target this release at (iOS only).'
		},
		plistFilePrefix: {
			help: ' Prefix to append to the file name when attempting to find your app\'s Info.plist file (iOS only).',
		
		},
		rollout: {
			type: 'Number',
			help: ' Percentage of users this release should be immediately available to'
		},
		sourcemapOutput: {
			type: 'FilePath',
			help: ' Path to where the sourcemap for the resulting bundle should be written. If omitted, a sourcemap will not be generated.'
		}
	},
	fieldsets: [{
		fields: 'platform,framework'
	}, {
		legend: 'Advanced',
		template: 'Details',
		fieldsets: [
			{
				legend: 'Deployment',
				fields: 'targetBinaryVersion,description,rollout,development,disabled,mandatory'
			},
			{
				legend: 'React Settings',
				conditional: {
					listen: 'framework',
					operator: '==',
					value: 'releaseReact'
				},
				fields: 'bundleName,gradleFile,plistFile,plistFilePrefix,sourcemapOutput'
			},
			{
				legend: 'Cordova Settings',
				conditional: {
					listen: 'framework',
					operator: '==',
					value: 'releaseCordova'
				},
				fields: 'build'
			}
		]
	}, {
		buttons: [{action: 'submit', primary: true, label: 'Release'}, {action: 'cancel', label: 'Cancel'}]
	}]
};

export default (props)=><Form schema={schema}
							  value={{
								  rollout: 100,
								  platform: 'ios',
								  framework: 'releaseReact'
							  }} {...props}/>
