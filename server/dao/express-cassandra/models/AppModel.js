const ec = require('express-cassandra');

module.exports = {
    fields: {
        id: {
            type: 'uuid',
            default(){
                return (this.id = ec.uuid());
            }
        },
        collaborators: {
            type: "map",
            typeDef: "<text, frozen<collaborator>>"
        },
        deployments: {
            type: "list",
            typeDef: "<text>"
        },
        name: "text"
    },
    key: [["id"]],
    indexes: ["name", 'keys("collaborators)'],
    table_name: "apps"
};
