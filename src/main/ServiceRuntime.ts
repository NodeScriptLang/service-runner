import { Logger } from '@nodescript/logger';
import { subtle, webcrypto } from 'crypto';
import WebSocket from 'isomorphic-ws';
import { config } from 'mesh-config';
import { dep } from 'mesh-ioc';

export class ServiceRuntime {

    @config({ default: '' }) private ENCRYPTED_VARIABLES!: string;
    @config() private VARIABLES_ENCRYPTION_KEY!: string;

    @dep() private logger!: Logger;

    variables: Record<string, string> = {};

    async start() {
        this.initPolyfills();
        await this.initVariables();
    }

    async stop() {}

    private initPolyfills() {
        if (!global.crypto?.subtle) {
            global.crypto = webcrypto as any;
        }
        this.logger.info(`Installed WebCrypto polyfill`);
        if (!global.WebSocket) {
            global.WebSocket = WebSocket;
        }
        this.logger.info(`Installed WebSocket polyfill`);
    }

    private async initVariables() {
        try {
            const encryptedVariables = this.ENCRYPTED_VARIABLES;
            if (!encryptedVariables) {
                this.logger.info('Skipping variables initialization because ENCRYPTED_VARIABLES is empty');
                return;
            }
            this.logger.info(`Initializing varibles`);
            const key = await this.getEncryptionKey();
            const variablesJson = await this.decrypt(this.ENCRYPTED_VARIABLES, key);
            this.variables = JSON.parse(variablesJson);
            this.logger.info(`Initialized ${Object.keys(this.variables).length} variables`);
        } catch (error) {
            this.logger.error(`Could not initialize variables`, { error });
            throw error;
        }
    }

    private async decrypt(data: string, key: CryptoKey) {
        const components = data.split(':');
        if (components.length !== 2) {
            throw new Error('Cannot decrypt: invalid encoding');
        }
        const [ivBase64, encryptedBase64] = components;
        const iv = Buffer.from(ivBase64, 'base64');
        const encryptedBuffer = Buffer.from(encryptedBase64, 'base64');
        const decryptedBuffer = await subtle.decrypt({
            name: 'AES-GCM',
            iv,
            length: 256,
        }, key, encryptedBuffer);
        return Buffer.from(decryptedBuffer).toString('utf-8');
    }

    private async getEncryptionKey() {
        return await subtle.importKey(
            'raw',
            Buffer.from(this.VARIABLES_ENCRYPTION_KEY, 'base64'),
            {
                name: 'AES-GCM',
                length: 256,
            },
            false,
            ['encrypt', 'decrypt']
        );
    }

}
