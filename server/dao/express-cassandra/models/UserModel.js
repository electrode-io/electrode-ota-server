const ec = require('express-cassandra');
module.exports = ({
    fields: {
        "email": "text",
        "accessKeys": {
            "type": "map",
            "typeDef": "<text, frozen<accesskey>>",
        },
        "createdTime": {
            type: "timestamp", default: {"$db_function": "toUnixTimestamp(now())"}
        },
        "id": {
            type: "uuid"
        },
        "linkedProviders": {
            "type": "list",
            "typeDef": "<text>"
        },
        name: "text"
    },
    key: [["email"]],
    indexes: ["id", 'keys("accessKeys")'],
    table_name: "users",
    toJSON(){
        console.log('I was called');
        return {};
    }
});
