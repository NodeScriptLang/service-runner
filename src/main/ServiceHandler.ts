import { GraphEvalContext } from '@nodescript/core/runtime';
import { HttpContext, HttpHandler } from '@nodescript/http-server';
import { RequestMethod, RequestSpec, ResponseSpecSchema } from '@nodescript/service-compiler';
import { config } from 'mesh-config';

export class ServiceHandler implements HttpHandler {

    @config()
    private NODESCRIPT_MODULE_URL!: string;

    async handle(ctx: HttpContext) {
        const ec = new GraphEvalContext();
        try {
            const { compute } = await import(this.NODESCRIPT_MODULE_URL);
            const $request = await this.createRequestObject(ctx);
            // TODO add support for variables
            const $variables = {};
            const { $response } = await compute({
                $request,
                $variables,
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
