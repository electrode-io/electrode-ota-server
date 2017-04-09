const ec = require('express-cassandra');
module.exports = ({
    fields: {
        "email": "text",
        "accessKeys": {
            "type": "map",
            "typeDef": "<text, frozen<accesskey>>",
        },
        "createdTime": "timestamp",
        "id": {
            type: "uuid",
            default(){
                return (this.id = ec.uuid());
            }
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
