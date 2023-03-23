import { HttpChain, HttpCorsHandler, HttpHandler, StandardHttpHandler } from '@nodescript/http-server';
import { dep } from 'mesh-ioc';

import { ServiceHandler } from './ServiceHandler.js';

export class AppHttpHandler extends HttpChain {

    @dep() private standardHttpHandler!: StandardHttpHandler;
    @dep() private corsHandler!: HttpCorsHandler;
    @dep() private serviceHandler!: ServiceHandler;

    handlers: HttpHandler[] = [
        this.standardHttpHandler,
        this.corsHandler,
        this.serviceHandler,
    ];

}
