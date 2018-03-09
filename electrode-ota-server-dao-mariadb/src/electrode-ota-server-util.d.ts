declare module "electrode-ota-server-util" {
    export function aes256Encrypt(passkey: string, data: string): string;
    export function aes256Decrypt(passkey: string, encrypted: string): string;
}
