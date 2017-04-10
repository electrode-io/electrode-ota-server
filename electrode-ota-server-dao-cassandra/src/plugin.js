"use strict";

import diregister from "electrode-ota-server-diregister";
import Dao from './dao-express-cassandra';

export const register = diregister({
    name: "ota!dao",
    multiple: false,
    connections: false,
    dependencies: ['ota!cassandra']
}, async (options, client) => {

    return new Dao({client})
});
