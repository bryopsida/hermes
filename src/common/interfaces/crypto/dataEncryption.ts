import { Stream } from 'stream'

export type Data = string | Buffer
export type DataOrStream = Data | Stream

export interface CipherText {
    ciphertext: DataOrStream;
    iv: Buffer;
    keyId: string;
    rootKeyId: string;
    authTag?: Buffer;
    algorithm: string;
    context?: string;
    dekContext?: string;
    rootKeyContext?: string;
}

export interface EncryptOpts {
    plaintext: DataOrStream;
    keyId: string;
    rootKeyId: string;
    rootKeyContext?: string;
    iv?: Buffer;
    algorithm?: string;
    context?: Buffer;
    dekContext?: string;
}

export type DecryptOpts = CipherText;

export interface SealedKey {
    keyId: string;
    rootKeyId?: string;
    iv: Buffer;
    authTag?: Buffer;
    keyCipherText: Buffer;
}

export interface IDataEncryptor {

    /**
     * Generate a new root key.
     * @param size key size in bytes
     * @param context Optional context used with AEAD to seal the root key. This context will be needed
     * to unseal the root key.
     * @returns A promise that resolves with the unique id for the new root key.
     */
    generateRootKey(size: number, context: string|undefined): Promise<string>;

    /**
     * Generates a key and stores it somewhere and only provides a unique
     * identifier back for it for later use.
     * @param size The size of the key to generate.
     * @param rootKeyId Unique identifier of the root key that will seal the key.
     * @param rootKeyContext Optional context used with AEAD to unseal the root key, this is required if the rootKey
     * had a context provided when it was generated.
     * @param context Optional context to be used for key sealing using AEAD.
     * @returns A Promise that resolves with the unique identifier of the key.
     */
    generateDataEncKey(size: number, rootKeyId: string, rootKeyContext: string|undefined, context: string|undefined): Promise<string>;

    /**
     * Destroys a data encryption key, any data encrypted with it will be
     * lost.
     * @param keyId id of the key to destroy.
     * @returns A Promise that resolves when the key is destroyed.
     */
    destroyDataEncKey(keyId: string): Promise<void>;

    /**
     * Destroys a root key, all associated data encryption keys will be lost along with their data.
     * @param rootKeyId The unique identifier of the root key to destroy.
     * @returns A Promise that resolves when the root key is destroyed.
     */
    destroyRootKey(rootKeyId: string): Promise<void>;

    /**
     * Encrypt data with a data encryption key.
     * @param
     * @returns A Promise that resolves with the encrypted data, encrypted data will be returned in the form it was given with the exception
     * of String which will be a base64 encoded string.
     */
    encrypt(encryptRequest: EncryptOpts) : Promise<CipherText>;

    /**
     * Decrypts ciphertext accordining to the provided options
     * @param decryptOpts Options and ciphertext to decrypt.
     * @returns A Promise that resolves with the decrypted data.
     */
    decrypt(decryptOpts: DecryptOpts): Promise<Buffer | Stream | string>;
}

export interface IKeyStore {
    saveSealedRootKey(rootKeyId: string, key: Buffer): Promise<void>;
    saveSealedDataEncKey(keyId: string, key: Buffer): Promise<void>;
    fetchSealedRootKey(rootKeyId: string): Promise<Buffer>;
    fetchSealedDataEncKey(keyId: string): Promise<Buffer>;
    destroySealedRootKey(rootKeyId: string): Promise<void>;
    destroySealedDataEncKey(keyId: string): Promise<void>;
    destroyAllKeys(): Promise<void>;
}
