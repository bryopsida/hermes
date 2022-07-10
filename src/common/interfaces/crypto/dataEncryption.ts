import { Stream } from 'stream'
import { IUsableClosable } from '../../using'

export type Data = string | Buffer
export type DataOrStream = Data | Stream

export interface KeyOpts {
    keyId: string;
    rootKeyId: string;
    dekContext?: string;
    rootKeyContext?: string;
}

export interface CipherText extends KeyOpts {
    ciphertext: DataOrStream;
    iv: Buffer;
    authTag?: Buffer;
    algorithm: string;
    context?: string;
}

export interface EncryptOpts extends KeyOpts {
    plaintext: DataOrStream;
    keyId: string;
    iv?: Buffer;
    algorithm?: string;
    context?: Buffer;
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

    hasDataEncKey(keyId: string): Promise<boolean>;
    hasRootKey(rootKeyId: string): Promise<boolean>;
    validate(keyOpts: KeyOpts, message: Buffer, digest: Buffer): Promise<boolean>;
    mac(keyOpts: KeyOpts, message: Buffer): Promise<Buffer>;

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

    /**
     * Takes a ciphertext object and provides a base64 encoded string of the ciphertext
     * with the iv on the front (16 bytes) and the auth tag on the end (16 bytes).
     * @param cipherText The ciphertext to encode.
     * @returns A Promise that resolves with the base64 encoded ciphertext.
     */
    encodeCipherText(cipherTxt: CipherText) : Promise<string>;

    /**
     * Encrypts the data and encodes to a base64 string.
     * @param encryptOpts Options and ciphertext to decrypt.
     * @returns A Promise that resolves with the encrypted base64 string
     */
    encryptAndEncode(encryptOpts: EncryptOpts): Promise<string>;

    /**
     * Decrypts encoded data and returns the decrypted plaintext string
     * @param encodedCipherText The encoded ciphertext to decrypt, this is base64 data encoded from
     * either the encodeCipherText or encryptAndEncode functions.
     * @param rootKeyContext base64 value of root key context, this must match the context used to seal the key.
     * @param dekContext base64 value of data encryption key context, this must match the context used to seal the key.
     * @param context base64 value of context used when encrypting the ciphertext, if this doesn't match decryption will fail.
     * @returns A Promise that resolves with the decrypted plaintext string.
     */
    decryptEncoded(encodedCipherText: string, rootKeyContext: string, dekContext: string, context: string): Promise<Buffer>;
}

export interface IKeyStore extends IUsableClosable {
    saveSealedRootKey(rootKeyId: string, key: Buffer): Promise<void>;
    saveSealedDataEncKey(keyId: string, key: Buffer): Promise<void>;
    hasSealedRootKey(rootKeyId: string): Promise<boolean>;
    hasSealedDataEncKey(keyId: string): Promise<boolean>;
    fetchSealedRootKey(rootKeyId: string): Promise<Buffer>;
    fetchSealedDataEncKey(keyId: string): Promise<Buffer>;
    destroySealedRootKey(rootKeyId: string): Promise<void>;
    destroySealedDataEncKey(keyId: string): Promise<void>;
    destroyAllKeys(): Promise<void>;
}
