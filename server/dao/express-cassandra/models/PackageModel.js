const ec = require('express-cassandra');

module.exports = ({
    fields: {
        id_: {
            type: 'uuid',
            default(){
                return (this.id_ = ec.uuid());
            }
        },
        "appVersion": "text",
        "blobUrl": "text",
        created_: "timestamp",
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
})
