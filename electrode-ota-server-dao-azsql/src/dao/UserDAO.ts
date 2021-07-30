import { format, IConnection } from "mysql";
import { AccessKeyQueries, UserAuthProviderQueries, UserQueries } from "../queries";

import BaseDAO from "./BaseDAO";

import { UserDTO } from "../dto";
import Encryptor from "../Encryptor";

import { difference, forOwn, omit, pick } from "lodash";

export default class UserDAO extends BaseDAO {
    public static async createUser(connection: IConnection, user: UserDTO): Promise<UserDTO> {

        const userResult = await UserDAO.getUserByEmail(connection, user.email);
        if (userResult && userResult.length > 0) {
            throw new Error("User with email [" + user.email + "] already exists.");
        } else {
            await UserDAO.beginTransaction(connection);
            const insertResult = await UserDAO.insertUser(connection, user);
            const userId = insertResult.insertId;
            const userMatches = await UserDAO.getUserById(connection, userId);

            const outgoing = new UserDTO();
            outgoing.id = userId;
            outgoing.email = userMatches[0].email;
            outgoing.createdTime = userMatches[0].created_time;
            outgoing.name = userMatches[0].name;

            Encryptor.instance.decryptDTO(outgoing);

            if (user.linkedProviders) {
                outgoing.linkedProviders = await UserDAO.createLinkedProviders(connection, userId,
                    user.linkedProviders);
            }

            if (user.accessKeys) {
                outgoing.accessKeys = await UserDAO.createAccessKeys(connection, userId, user.accessKeys);
            }

            await UserDAO.commit(connection);
            return outgoing;
        }
    }

    public static async userByEmail(connection: IConnection, email: string): Promise<UserDTO> {
        const userResult = await UserDAO.getUserByEmail(connection, email);
        if (!userResult || userResult.length === 0) {
            throw new Error("No user found with email [" + email + "]");
        }

        return await UserDAO.generateOutgoingUser(connection, userResult);
    }

    public static async userByAccessKey(connection: IConnection, accessKey: string): Promise<UserDTO> {
        const userResult = await UserDAO.getUserByAccessKey(connection, accessKey);
        if (!userResult || userResult.length === 0) {
            throw new Error("No user found with access key [" + accessKey + "]");
        }

        return await UserDAO.generateOutgoingUser(connection, userResult);
    }

    public static async userById(connection: IConnection, userId: number): Promise<UserDTO> {
        const userResult = await UserDAO.getUserById(connection, userId);

        if (!userResult || userResult.length === 0) {
            throw new Error("No user found with id [" + userId + "]");
        }

        return await UserDAO.generateOutgoingUser(connection, userResult);
    }

    public static async updateUser(connection: IConnection, currentEmail: string,
        updateInfo: UserDTO): Promise<UserDTO> {
        /*
            This function is used to
            - add a new access key
            - delete an access key
            - update the last access time of an access key
            - update the friendly name and/or expiration time of an access key
            - add a new auth provider
        */

        if (!updateInfo.accessKeys) {
            throw new Error("incoming accessKeys property must be provided.");
        }

        const userDTO = await UserDAO.userByEmail(connection, currentEmail);
        const existingAccessKeys = userDTO.accessKeys;
        const updatedAccessKeys = updateInfo.accessKeys;

        // check if there's a new access key
        const newAccessKeyNames = difference(Object.keys(updatedAccessKeys), Object.keys(existingAccessKeys));
        if (newAccessKeyNames && newAccessKeyNames.length > 0) {
            const newAccessKeys = pick(updatedAccessKeys, newAccessKeyNames);

            // this creates the new ones and then fetches all of them
            userDTO.accessKeys = await UserDAO.createAccessKeys(connection, userDTO.id as number, newAccessKeys);
            return userDTO;
        }

        // check if there's a deleted key
        const remAccessKeyNames = difference(Object.keys(existingAccessKeys), Object.keys(updatedAccessKeys));
        if (remAccessKeyNames && remAccessKeyNames.length > 0) {
            const removeAccessKeys = pick(existingAccessKeys, remAccessKeyNames);
            await UserDAO.beginTransaction(connection);
            await UserDAO.removeAccessKeys(connection, removeAccessKeys);
            await UserDAO.commit(connection);

            return await UserDAO.userByEmail(connection, currentEmail);
        }

        // check if data in existing access keys changed
        const accessKeysToUpdate: any[] = [];
        forOwn(existingAccessKeys, (existingKey, existingKeyName) => {
            const updatedKey = updatedAccessKeys[existingKeyName];
            let updated = false;

            updatedKey.id = existingKey.id;

            if (updatedKey.friendlyName &&
                (!existingKey.friendlyName ||
                    (updatedKey.friendlyName !== existingKey.friendlyName))) {
                updated = true;
            } else if (!updatedKey.friendlyName) {
                updatedKey.friendlyName = existingKey.friendlyName;
            }

            if (updatedKey.lastAccess &&
                (!existingKey.lastAccess ||
                    (updatedKey.lastAccess !== existingKey.lastAccess.getTime()))) {
                updated = true;
            } else if (!updatedKey.lastAccess) {
                updatedKey.lastAccess = existingKey.lastAccess;
            }

            if (updatedKey.expires &&
                (!existingKey.expires ||
                    (updatedKey.expires !== existingKey.expires.getTime()))) {
                updated = true;
            } else if (!updatedKey.expires) {
                updatedKey.expires = existingKey.expires;
            }

            if (updated) {
                accessKeysToUpdate.push(updatedKey);
            }
        });

        if (accessKeysToUpdate.length > 0) {
            userDTO.accessKeys = await UserDAO.updateAccessKeys(connection, userDTO.id as number, accessKeysToUpdate);
            return userDTO;
        }

        // check if new auth provider(s)
        const newAuthProviders = difference(updateInfo.linkedProviders, userDTO.linkedProviders);
        if (newAuthProviders && newAuthProviders.length > 0) {
            userDTO.linkedProviders = await UserDAO.createLinkedProviders(connection,
                userDTO.id as number, newAuthProviders);
        }
        return userDTO;
    }

    private static async generateOutgoingUser(connection: IConnection, userResult: any): Promise<UserDTO> {
        const userId = userResult[0].id;
        const outgoing = new UserDTO();
        outgoing.id = userResult[0].id;
        outgoing.email = userResult[0].email;
        outgoing.createdTime = userResult[0].created_time;
        outgoing.name = userResult[0].name;
        Encryptor.instance.decryptDTO(outgoing);

        outgoing.accessKeys = await UserDAO.getAccessKeysByUserId(connection, userId)
            .then(UserDAO.transformOutgoingAccessKeys);
        outgoing.linkedProviders = await UserDAO.getLinkedProvidersForUser(connection, userId)
            .then(UserDAO.transformOutgoingLinkedProviders);
        return outgoing;
    }

    private static async getUserByEmail(connection: IConnection, email: string): Promise<any> {
        return UserDAO.query(connection, UserQueries.getUserByEmail, [Encryptor.instance.encrypt("user.email", email)]);
    }

    private static async insertUser(connection: IConnection, user: UserDTO): Promise<any> {
        const user_email = Encryptor.instance.encrypt("user.email", user.email);
        const user_name = Encryptor.instance.encrypt("user.name", user.name);
        return UserDAO.query(connection, UserQueries.insertUser, [user_email, user_name]);
    }

    private static async getUserById(connection: IConnection, id: number): Promise<any> {
        return UserDAO.query(connection, UserQueries.getUserById, [id]);
    }

    private static async getUserByAccessKey(connection: IConnection, accessKey: string): Promise<any> {
        return UserDAO.query(connection, UserQueries.getUserByAccessKey, [accessKey]);
    }

    private static async createAccessKeys(connection: IConnection, userId: number, accessKeys: any): Promise<any> {
        // accessKeys is an object with property names being the key
        // and the values being the metadata about the key; this is
        // mapping the keys to an array of insert statement promises
        return Promise.all(Object.keys(accessKeys).map((keyName) => {
            return UserDAO.insertAccessKey(connection, userId, accessKeys[keyName]);
        })).then(() => {
            // once all the inserts are done, query the db;
            // we should get back an array of access key metadata; this
            // reduces the array back to its original object format
            return UserDAO.getAccessKeysByUserId(connection, userId).then(UserDAO.transformOutgoingAccessKeys);
        });
    }

    private static async updateAccessKeys(connection: IConnection, userId: number, accessKeys: any[]): Promise<any> {
        return Promise.all(accessKeys.map((accessKey) => {
            return UserDAO.updateAccessKey(connection, accessKey);
        })).then(() => {
            return UserDAO.getAccessKeysByUserId(connection, userId).then(UserDAO.transformOutgoingAccessKeys);
        });
    }

    private static async removeAccessKeys(connection: IConnection, accessKeys: any): Promise<any> {
        return Promise.all(Object.keys(accessKeys).map((keyName) => {
            return UserDAO.deleteAccessKey(connection, accessKeys[keyName]);
        }));
    }

    private static async insertAccessKey(connection: IConnection, userId: number, accessKey: any): Promise<any> {
        const expires = (typeof accessKey.expires === "number") ? new Date(accessKey.expires) : accessKey.expires;
        const friendly_name = Encryptor.instance.encrypt("access_key.friendly_name", accessKey.friendlyName);
        const description = Encryptor.instance.encrypt("access_key.description", accessKey.description);

        return UserDAO.query(connection, AccessKeyQueries.insertAccessKey,
            [userId, accessKey.name, accessKey.createdBy,
                expires, friendly_name, description]);
    }

    private static async updateAccessKey(connection: IConnection, accessKey: any): Promise<any> {
        const expires = (typeof accessKey.expires === "number") ? new Date(accessKey.expires) : accessKey.expires;
        const lastAccess = (typeof accessKey.lastAccess === "number") ?
            new Date(accessKey.lastAccess) : accessKey.lastAccess;

        const friendly_name = Encryptor.instance.encrypt("access_key.friendly_name", accessKey.friendlyName);

        return UserDAO.query(connection, AccessKeyQueries.updateAccessKey,
            [lastAccess, friendly_name, expires, accessKey.id]);
    }

    private static async getAccessKeysByUserId(connection: IConnection, userId: number): Promise<any> {
        return UserDAO.query(connection, AccessKeyQueries.getAccessKeysByUserId, [userId]);
    }

    private static async deleteAccessKey(connection: IConnection, accessKey: any): Promise<any> {
        return UserDAO.query(connection, AccessKeyQueries.deleteAccessKeyById, [accessKey.id]);
    }

    private static transformOutgoingAccessKeys(accessKeys: any[]): any {
        return accessKeys.reduce((obj: any, accessKey: any) => {
            const friendlyName = Encryptor.instance.decrypt("access_key.friendly_name", accessKey.friendly_name);
            const description = Encryptor.instance.decrypt("access_key.description", accessKey.description);
            obj[accessKey.name] = {
                createdTime: accessKey.created_time,
                description,
                email: accessKey.email,
                expires: accessKey.expires,
                friendlyName,
                id: accessKey.id,
                lastAccess: accessKey.last_access,
                name: accessKey.name,
            };
            return obj;
        }, {});
    }

    private static async createLinkedProviders(connection: IConnection, userId: number, providers: any): Promise<any> {
        // insert them in the db
        return Promise.all(providers.map((provider: string) => {
            return UserDAO.insertLinkedProvider(connection, userId, provider);
        })).then(() => {
            // after they are all inserted, retrieve them and build an array of the provider names
            return UserDAO.getLinkedProvidersForUser(connection, userId).then(UserDAO.transformOutgoingLinkedProviders);
        });
    }

    private static async insertLinkedProvider(connection: IConnection, userId: number, provider: string): Promise<any> {
        return UserDAO.query(connection, UserAuthProviderQueries.insertAuthProvider, [userId, provider]);
    }

    private static async getLinkedProvidersForUser(connection: IConnection, userId: number): Promise<any> {
        return UserDAO.query(connection, UserAuthProviderQueries.getAuthProvidersForUserId, [userId]);
    }

    private static transformOutgoingLinkedProviders(providers: any[]): string[] {
        return providers.map((provider: any) => {
            return provider.provider;
        });
    }
}
