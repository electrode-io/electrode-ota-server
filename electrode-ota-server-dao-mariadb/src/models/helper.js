import {
    aes256Encrypt,
    aes256Decrypt
} from "electrode-ota-server-util";

function encryptValue(passphrase, val) {
    return aes256Encrypt(passphrase, val);
}

function decryptValue(passphrase, val) {
    return aes256Decrypt(passphrase, val);
}

function encryptWhereValues(sequelize, model, where) {
    for (const attr in model.attributes) {
        if (model.attributes[attr].isEncrypted && where[attr]) {
            where[attr] = encryptValue(sequelize.config.encryptEmailPassphrase, where[attr]);
        }
    }
}

export const encryptField = function (sequelize, fieldName, definition) {
    if (sequelize.config.encryptEmailPassphrase) {
        return Object.assign(definition, {
            isEncrypted: true,
            set(val) {
                if (val) {
                    val = encryptValue(sequelize.config.encryptEmailPassphrase, val);
                    this.setDataValue(fieldName, val);
                }
            },
            get() {
                let val = this.getDataValue(fieldName);
                return decryptValue(sequelize.config.encryptEmailPassphrase, val);
            }
        });
    } else {
        return definition;
    }
};

/**
 * Returns a sequelize `beforeFind` hook that encrypts where clause values
 * of encrypted fields
 */
export const encryptWhereForFind = function (sequelize, model) {
    if (sequelize.config.encryptEmailPassphrase) {
        return (options) => {
            if (options.where) {
                encryptWhereValues(sequelize, model, options.where);

            }
        };
    } else {
        return () => {};
    }
};

export const encryptIncludeForFind = function (sequelize, model) {
    if (sequelize.config.encryptEmailPassphrase) {
        return (options) => {
            if (options.include) {
                options.include.forEach(includeItem => {
                    if (includeItem.model === model) {
                        if (includeItem.where) {
                            encryptWhereValues(sequelize, model, includeItem.where);
                        }
                    }
                });
            }
        }
    }
}
