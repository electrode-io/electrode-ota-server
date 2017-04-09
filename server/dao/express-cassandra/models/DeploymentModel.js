const {model} = require('express-cassandra');

module.exports = {
    fields: {
        key: "text",
        createdTime: {
            type: "timestamp",
            default: {"$db_function": "toTimestamp(now())"}
        },
        history_: {
            type: "list",
            typeDef: "<uuid>"
        },
        id: "uuid",
        name: "text"
    },
    key: [["key"]],
    indexes: ["name"],
    table_name: "deployments"
};
