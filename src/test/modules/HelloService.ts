import { RequestSpec, ResponseSpec } from '@nodescript/service-compiler';

export function compute(params: { $request: RequestSpec }) {
    const $response: ResponseSpec = {
        status: 200,
        headers: {},
        body: `Hello, ${params.$request.query.name}`,
        attributes: {},
    };
    return { $response };
}
