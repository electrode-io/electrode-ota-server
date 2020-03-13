import { aes256Encrypt, aes256Decrypt } from "electrode-ota-server-util";
import { readFile } from "fs";
import {
    PackageDTO,
    UserDTO
} from "./dto"

export default class Encryptor {
    private encryptKey: string | null;
    private fields: string[];
    public static instance: Encryptor = new Encryptor();

    constructor() {
        this.fields = [];
        this.encryptKey = null;
    }

    /**
     * Initialize Encryptor
     *
     * @param options List of options
     *  "keyfile": Location of file containing the encryption key.  If keyfile exists, encryption is enabled.
     *  "fields": List of fields to encrypt.  Supported fields are.
     *      "user.name" - User's name
     *      "user.email" - User's email
     *      "package.released_by" - Package's released by field
     *
     * ie.
     * {
     *  "keyfile": "./test/sample_encryption.key",
     *  "fields": ["user.name", "user.email"]
     * }
     *
     */
    initialize(options: any): Promise<void> {
        if (options.keyfile) {
            this.fields = options.fields || [];
            this.encryptKey = null;
            return new Promise((resolve, reject) => {
                readFile(options.keyfile, (err, data) => {
                    if (err) {
                        reject(err);
                    } else {
                        this.encryptKey = data.toString();
                        resolve();
                    }
                })
            });
        }
        return Promise.resolve();
    }

    encrypt(fieldName: string, val: string): string {
        if (this.encryptKey && (this.fields.indexOf(fieldName) >= 0) && val) {
            let value = val;
            if (fieldName === "user.email") {
                value = val.toLowerCase();
            }
            return aes256Encrypt(this.encryptKey, value);
        }
        return val;
    }
    decrypt(fieldName: string, val: string): string {
        if (this.encryptKey && (this.fields.indexOf(fieldName) >= 0) && val) {
            return aes256Decrypt(this.encryptKey, val);
        }
        return val;
    }
    encryptDTO(dto: any) {
        if (dto instanceof UserDTO) {
            dto.email = this.encrypt("user.email", dto.email);
            dto.name = this.encrypt("user.name", dto.name);
        } else if (dto instanceof PackageDTO) {
            dto.releasedBy = this.encrypt("package.released_by", dto.releasedBy);
        }
    }
    decryptDTO(dto: any) {
        if (dto instanceof UserDTO) {
            dto.email = this.decrypt("user.email", dto.email);
            dto.name = this.decrypt("user.name", dto.name);
        } else if (dto instanceof PackageDTO) {
            dto.releasedBy = this.decrypt("package.released_by", dto.releasedBy);
        }
    }
}
