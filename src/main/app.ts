import { HttpCorsHandler, HttpServer, StandardHttpHandler } from '@nodescript/http-server';
import { Logger } from '@nodescript/logger';
import { BaseApp, StandardLogger } from '@nodescript/microservice';
import { Config, ProcessEnvConfig } from 'mesh-config';
import { dep, Mesh } from 'mesh-ioc';

import { AppHttpHandler } from './AppHttpHandler.js';
import { ServiceHandler } from './ServiceHandler.js';

export class App extends BaseApp {

    @dep() httpServer!: HttpServer;

    constructor() {
        super(new Mesh('App'));
        this.mesh.constant(HttpServer.SCOPE, () => this.createSessionScope());
        this.mesh.service(Config, ProcessEnvConfig);
        this.mesh.service(Logger, StandardLogger);
        this.mesh.service(HttpServer);
        this.mesh.service(AppHttpHandler);
        this.mesh.service(StandardHttpHandler);
        this.mesh.service(HttpCorsHandler);
        this.mesh.service(ServiceHandler);
        this.mesh.alias(HttpServer.HANDLER, AppHttpHandler);
    }

    createSessionScope() {
        const mesh = new Mesh('Request');
        mesh.parent = this.mesh;
        return mesh;
    }

    async start() {
        await this.httpServer.start();
    }

    async stop() {
        await this.httpServer.stop();
    }

}
