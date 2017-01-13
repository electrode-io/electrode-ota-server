module.exports = function loadCassandra(keyspace) {
    return [

        `CREATE KEYSPACE ${keyspace} WITH replication = {'class': 'SimpleStrategy', 'replication_factor': '1'}  AND durable_writes = true;`,
        `USE ${keyspace};`,
        `CREATE TYPE ${keyspace}.accessKey (
    name text,
    id text,    
    expires timestamp,
    description text,
    "lastAccess" timestamp,
    "createdTime" timestamp,
    "createdBy" text,
    "friendlyName" text
);`,

        `CREATE TYPE ${keyspace}.packageMap (
    size varint,
    url text
);`,

        `CREATE TYPE ${keyspace}.user (
    email text,
    id uuid
);`,


        `CREATE TYPE ${keyspace}.collaborator (
    permission text
);`,

        `CREATE TABLE ${keyspace}.apps (
    id uuid ,
    name text,
    deployments set<text>,
    collaborators map<text, frozen<collaborator>>,
    PRIMARY KEY (id)
    );`,

        `CREATE TABLE ${keyspace}.users (
    id uuid,
    email text ,
    "accessKeys" map<text, frozen<accessKey>>,
    "linkedProviders" list<text>,
    name text,
    "createdTime" timestamp,
    PRIMARY KEY (email)
);`,
        `CREATE TABLE ${keyspace}.deployments_app_name (
        app uuid,
        name text,
        key text,
        PRIMARY KEY (app, name)
);`,

        //history_ and label_ are the label of the packages
        // SELECT * from packages where _id in (history_) and label = 'v1'
        `CREATE TABLE ${keyspace}.deployments (
    id uuid,
    "createdTime" timestamp,
    name text,
    key text,
    history_ list<uuid>,
    PRIMARY KEY (key)
);

`,

        `CREATE TABLE ${keyspace}.packages (
    "id_" timeuuid,
    created_ timestamp,
    "packageHash" text,
    "appVersion" text,
    "blobUrl" text,
    description text,
    rollout tinyint,
    size varint,
    "uploadTime" timestamp,
    "releaseMethod" text,
    "originalLabel" text,
    "originalDeployment" text,
    label text,
    "releasedBy" text,
    "manifestBlobUrl" text,
    "diffPackageMap" map<text, frozen<packagemap>>,
    "isDisabled" boolean,
    "isMandatory" boolean,
    PRIMARY KEY (id_) 
);`,

        `CREATE TABLE ${keyspace}.metrics (

            id timeuuid,
            appVersion text,
            status text,
            previousLabelOrAppVersion text,
            previousDeploymentKey text,
            clientUniqueId text,
            deploymentKey text,
            label text,
            PRIMARY KEY (id, deploymentKey)      
);`,

        `
    CREATE TABLE ${keyspace}.client_ratio (
       "clientUniqueId" text,
       "packageHash" text,
       ratio float,
       updated boolean,
       inserted timestamp,
       PRIMARY KEY ("clientUniqueId",  inserted)
    )  WITH CLUSTERING ORDER BY (inserted DESC);
`,
        `create TABLE ${keyspace}.packages_content ( "packageHash" text, content blob, PRIMARY KEY ("packageHash") );`,

        `CREATE INDEX users_id ON ${keyspace}.users (id);`,
        `CREATE INDEX users_accessKeys ON ${keyspace}.users (KEYS("accessKeys"));`,
        `CREATE INDEX apps_collaborators ON ${keyspace}.apps (KEYS(collaborators));`,
        `CREATE INDEX apps_name ON ${keyspace}.apps (name);`,
        `CREATE INDEX deployments_name ON ${keyspace}.deployments (name);`,
        `CREATE INDEX packages_label ON ${keyspace}.packages (label);`,
        `CREATE INDEX metrics_key ON ${keyspace}.metrics (deploymentKey);`,
        `CREATE INDEX client_ratio_package ON ${keyspace}.client_ratio ("packageHash");`
        //     `CREATE INDEX packages_key ON packages (key_);`
        //REMOVE FROM PRODUCTION
    ]
};
