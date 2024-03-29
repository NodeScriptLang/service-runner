import { HttpCorsHandler, HttpServer, StandardHttpHandler } from '@nodescript/http-server';
import { Logger } from '@nodescript/logger';
import { BaseApp, StandardLogger } from '@nodescript/microframework';
import { Config, ProcessEnvConfig } from 'mesh-config';
import { dep, Mesh } from 'mesh-ioc';

import { AppHttpHandler } from './AppHttpHandler.js';
import { ReportingService } from './ReportingService.js';
import { ServiceHandler } from './ServiceHandler.js';
import { ServiceRuntime } from './ServiceRuntime.js';

export class App extends BaseApp {

    @dep() private httpServer!: HttpServer;
    @dep() private runtime!: ServiceRuntime;
    @dep() private reporting!: ReportingService;

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
        this.mesh.service(ServiceRuntime);
        this.mesh.service(ReportingService);
        this.mesh.alias(HttpServer.HANDLER, AppHttpHandler);
    }

    createSessionScope() {
        const mesh = new Mesh('Request');
        mesh.parent = this.mesh;
        return mesh;
    }

    override async start() {
        await super.start();
        await this.runtime.start();
        await this.reporting.start();
        await this.httpServer.start();
    }

    override async stop() {
        await super.stop();
        await this.httpServer.stop();
        await this.reporting.stop();
        await this.runtime.stop();
    }

}
