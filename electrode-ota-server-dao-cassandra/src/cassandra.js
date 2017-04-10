import diregister from "electrode-ota-server-diregister";
import client from './index';

export const register = diregister({
    name: "ota!cassandra",
    multiple: false,
    connections: false,
    dependencies: []
}, client);
export default ({register});