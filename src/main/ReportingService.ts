import { RequestSpec, ResponseSpec } from '@nodescript/core/schema';
import { Logger } from '@nodescript/logger';
import { config } from 'mesh-config';
import { dep } from 'mesh-ioc';

export interface EndpointSample {
    endpointId: string;
    group: string;
    count: number;
    latency: number;
    request?: any;
    response?: any;
}

export class ReportingService {

    @config({ default: 'https://api.nodescript.dev' })
    private NODESCRIPT_API_URL!: string;

    @config({ default: '' })
    private NODESCRIPT_WORKSPACE_ID!: string;

    @config({ default: '' })
    private NODESCRIPT_REPORT_TOKEN!: string;

    @config({ default: 30_000 })
    private REPORT_DEBOUNCE_MS!: number;

    @dep() private logger!: Logger;

    private lastSentAt = 0;
    private outstandingSamples = new Map<string, EndpointSample>;

    async start() {
        if (!this.NODESCRIPT_REPORT_TOKEN) {
            this.logger.warn('Sending reports is disabled because NODESCRIPT_REPORT_TOKEN is not specified');
            this.sendSamples = async () => {};
            return;
        }
        if (!this.NODESCRIPT_WORKSPACE_ID) {
            this.logger.warn('Sending reports is disabled because NODESCRIPT_WORKSPACE_ID is not specified');
            this.sendSamples = async () => { };
            return;
        }
    }

    async stop() {}

    async collectSample(endpointId: string, group: string, latency: number, request: RequestSpec, response: ResponseSpec) {
        const key = [endpointId, group].join(':');
        const sample = this.outstandingSamples.get(key);
        if (sample) {
            sample.count += 1;
            sample.latency += latency;
            sample.request = request;
            sample.response = request;
        } else {
            this.outstandingSamples.set(key, {
                endpointId,
                group,
                count: 1,
                latency,
                request,
                response,
            });
        }
        // Stats are only sent once per REPORT_DEBOUNCE_MS;
        // during that time stats are only collected, but are send with the next invocation
        if (Date.now() - this.lastSentAt > this.REPORT_DEBOUNCE_MS) {
            this.lastSentAt = Date.now();
            const samples = [...this.outstandingSamples.values()];
            this.outstandingSamples.clear();
            await this.sendSamples(samples);
        }
    }

    private async sendSamples(samples: EndpointSample[]) {
        const url = new URL('Invoke/reportSamples', this.NODESCRIPT_API_URL);
        const res = await fetch(url.href, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'authorization': `Bearer ${this.NODESCRIPT_REPORT_TOKEN}`,
            },
            body: JSON.stringify({
                workspaceId: this.NODESCRIPT_WORKSPACE_ID,
                timestamp: Date.now(),
                samples,
            }),
        });
        if (res.ok) {
            this.logger.info(`Reported ${samples.length} samples`);
        } else {
            this.logger.error(`Sample reporting failed`, {
                status: res.status,
                response: await res.text(),
            });
        }
    }

}
