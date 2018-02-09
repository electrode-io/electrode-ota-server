### Tables

##### user
This table contains registered user information.  It represents a developer who will upload app updates to one or more projects.

- ```id``` an id for the record
- ```email``` the email address of the developer
- ```create_time``` the time the record was created
- ```name``` the name of the developer

##### access_key
This table contains access keys generated for a user.  An access key must be attached to all requests that update an application.  A user can have one or more access keys.

- ```id``` an id for the record
- ```user_id``` id from the ```user``` table for the user to which this access key belongs
- ```name``` the value of the access key
- ```create_time``` the time the record was created
- ```created_by``` userid of the person who created the access key
- ```expires``` the time when the access key expires
- ```last_access``` the last time the key was accessed
- ```friendly_name``` a more user-friendly name for the access key
- ```description``` a description for the access key

##### user_auth_provider
This table contains a list of the authentication providers a user used when first registering with the system.  A user can have one or more providers.

- ```user_id``` id from the ```user``` table for the user
- ```provider``` a text description of the provider, such as "Github" or "LDAP"

##### app
This table represents an application.  The recommendation from CodePush is to have an application record per OS.  So there could be "IMS-iOS" and "IMS-Android" applications in the table.

- ```id``` an id uniquely identifying the app record
- ```name``` the name of the application

##### app_permission
This table represents which users are able to update which applications.

- ```app_id``` id from the ```app``` table
- ```user_id``` id from the ```user``` table
- ```permission``` string stating permission level; will either be "Owner" or "Collaborator"

##### deployment
This table represents a deployment level for an application.  CodePush by default creates two deployments for an app: Staging and Production.  A user could add more.

- ```id``` unique id for the deployment record
- ```app_id``` id from the ```app``` table for the app to which this deployment is linked
- ```create_time``` time the record was created
- ```name```  a name for the deployment such as "Staging" or "Production"
- ```deployment_key``` the value of the deployment key

##### package
This table is the metadata for an update package, the content which is being upload by the developer and later downloaded by a device.

- ```id``` unique id for the package record
- ```app_version``` the version of the application .ipa or .apk to which this package is linked; considered the minimum client version this package applies to
- ```blob_url``` a url that is a download location for the entire content zip
- ```create_time``` time the record was created
- ```description``` a description for the package
- ```is_disabled``` true/false (1/0) for whether the package is available
- ```is_mandatory``` true/false (1/0) for whether the end user has a choice for accepting the update
- ```label``` a version label for the content
- ```manifest_blob_url``` a url that is a download location for a json string representing the file content of the zip
- ```original_deployment_name``` the original deployment where the package was distributed; will get populated once the package is promoted to a new deployment
- ```original_label``` original version label
- ```package_hash``` a hash calculated off the content of the uploaded zip; uniquely identifes the content
- ```release_method``` string describing how the update was released; typically "Upload"
- ```released_by``` userid of the person who released the update
- ```rollout``` number 0.0 - 100.0 representing what percentage of devices should receive the update
- ```size``` size of the uploaded content in bytes
- ```upload_time``` the time the update was uploaded

##### package_content
This table maps a packageHash to the content.

- ```package_hash``` - hash identifying the content
- ```content``` - blob of the content of a zip or a json string

##### deployment_package_history
This table links a deployment and a package.

- ```deployment_id``` id of the deployment
- ```package_id``` id of the package

##### package_diff
This table represents metadata about a diff package that was created between two packages.  For example, suppose I release update #3, and there is a device has update #1.  When the device checks for an update, the system will create a diff between the content of update #3 and update #1 so that the device only needs to download files that changed.  The system creates a zip with the changed content and stores it.  This table has the url for the diff'ed zip.

- ```left_package_id``` id for one of the packages being diff'ed
- ```right_package_id``` id for the other package being diff'ed
- ```size``` size of the zip containing the changed files
- ```url``` url of the zip containing the changed files

##### client_ratio
When uploading an update, the developer has the choice of what percentage of devices should receive an update.  If the developer chooses a percentage less than 100, then as each device checks for an update, a random number is generated, and if it's within the threshold, it receives the update.  Otherwise it does not receive the update.  Since a random number is getting generated each time a client checks for an upate, this table is used to store what was generated for a given package and client.  The system will consult the table for the client first.  If no record exists, it will generate a new one and store it.

- ```client_unique_id``` an id generated by the device OS that uniquely identifies the device
- ```package_id``` id from the package table
- ```create_time``` time the record was created
- ```ratio``` the ratio of the package that was used to calculate whether an update was applicable
- ```is_updated``` true/false (1/0) whether the device was told that it could update

##### metric
This table is logging for whether a device downloaded an update and installed the update.

- ```deployment_id``` id from the deployment table
- ```app_version``` the version of the client application (.ipa/.apk)
- ```client_unique_id``` an id generated by the device OS that uniquely identifies the device
- ```label``` a version label for the update
- ```previous_deployment_key``` the deployment key that was used prior to this update being downloaded or installed
- ```previous_label_or_app_version```
- ```status``` string representing what happened such as "Download successful" or "Installed"

##### package_tag
This table keeps track of the different tags that are assigned to a package deployment.

- ```id``` the id for the tag
- ```tag_name``` the name of the tag
- ```deployment_id``` id from the deployment table
- ```package_id``` id from the package table