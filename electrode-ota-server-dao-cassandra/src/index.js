import diregister from "electrode-ota-server-diregister";
import client from './client';

export const clientFactory = client;

export const register = diregister({
    name: "ota!cassandra",
    multiple: false,
    connections: false,
    dependencies: []
}, clientFactory);

