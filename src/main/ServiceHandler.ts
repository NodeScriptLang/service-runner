import { GraphEvalContext } from '@nodescript/core/runtime';
import { HttpContext, HttpHandler } from '@nodescript/http-server';
import { RequestMethod, RequestSpec, ResponseSpecSchema } from '@nodescript/service-compiler';
import { dep } from 'mesh-ioc';

import { ServiceRuntime } from './ServiceRuntime.js';

export class ServiceHandler implements HttpHandler {

    @dep() private runtime!: ServiceRuntime;

    async handle(ctx: HttpContext) {
        const ec = new GraphEvalContext();
        try {
            const $request = await this.createRequestObject(ctx);
            const { $response } = await this.runtime.compute({
                $request,
                $variables: this.runtime.variables,
            }, ec);
            const response = ResponseSpecSchema.decode($response);
            ctx.status = this.convertResponseStatus(response.status);
            ctx.responseHeaders = response.headers;
            ctx.responseBody = response.body;
        } catch (error) {
            ctx.status = 500;
            // TODO decide on the information we provide in the response
            ctx.responseBody = {
                name: 'ServerError',
                message: 'The platform issue has occurred. We\'re already on it.',
            };
        } finally {
            await ec.disposeAll();
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
