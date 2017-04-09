const models = require('express-cassandra');
module.exports = ({
    fields: {
        id_: {
            type: 'uuid'
        },
        "appVersion": "text",
        "blobUrl": "text",
        created_: {
            type: "timestamp",

            // default: {"$db_function": "toUnixTimestamp(now())"}
        },
        description: "text",
        "diffPackageMap": {
            type: "map",
            typeDef: "<text, frozen<packagemap>>"
        },
        "isDisabled": "boolean",
        "isMandatory": "boolean",
        label: "text",
        "manifestBlobUrl": "text",
        "originalDeployment": "text",
        "originalLabel": "text",
        "packageHash": "text",
        "releaseMethod": "text",
        "releasedBy": "text",
        rollout: "tinyint",
        size: "varint",
        "uploadTime": "timestamp"
    },
    key: [["id_"]],
    indexes: ["label"],
    table_name: "packages"
});
