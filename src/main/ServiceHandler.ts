import { GraphEvalContext } from '@nodescript/core/runtime';
import { RequestMethod, RequestSpec, ResponseSpec, ResponseSpecSchema } from '@nodescript/core/schema';
import { HttpContext, HttpHandler } from '@nodescript/http-server';
import { config } from 'mesh-config';
import { dep } from 'mesh-ioc';

import { ReportingService } from './ReportingService.js';
import { ServiceRuntime } from './ServiceRuntime.js';

export class ServiceHandler implements HttpHandler {

    @config() private NODESCRIPT_MODULE_URL!: string;

    @dep() private runtime!: ServiceRuntime;
    @dep() private reporting!: ReportingService;

    async handle(ctx: HttpContext) {
        const ec = new GraphEvalContext();
        ec.setLocal('ns:env', 'server');
        const $request = await this.createRequestObject(ctx);
        let attributes: Record<string, string> = {};
        try {
            const { compute } = await import(this.NODESCRIPT_MODULE_URL);
            const { $response } = await compute({
                $request,
                $variables: this.runtime.variables,
            }, ec);
            const response = ResponseSpecSchema.decode($response);
            attributes = response.attributes;
            ctx.status = this.convertResponseStatus(response.status);
            ctx.responseHeaders = response.headers;
            ctx.responseBody = response.body;
        } catch (error: any) {
            ctx.status = 500;
            ctx.responseBody = {
                name: error.name,
                message: error.message,
            };
        } finally {
            await ec.finalize();
            const endpointId = ec.getLocal<string>('$routeId');
            if (endpointId) {
                const group = String(ctx.status);
                const latency = Date.now() - ctx.startedAt;
                const $response: ResponseSpec = {
                    status: ctx.status,
                    headers: ctx.responseHeaders,
                    body: ctx.responseBody,
                    attributes,
                };
                await this.reporting.collectSample(endpointId, group, latency, $request, $response);
            }
        }
    }

    private async createRequestObject(ctx: HttpContext): Promise<RequestSpec> {
        const body = await ctx.readRequestBody();
        return {
            method: ctx.method as RequestMethod,
            path: ctx.path,
            query: ctx.query,
            headers: ctx.requestHeaders,
            body,
        };
    }

    private convertResponseStatus(status: number) {
        if (status >= 100 && status <= 599) {
            return status;
        }
        return 500;
    }

}
