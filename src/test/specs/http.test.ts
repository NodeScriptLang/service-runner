import assert from 'assert';

import { runtime } from '../runtime.js';

describe('Http Service Runner', () => {

    it('returns the expected response from Hello Service', async () => {
        runtime.setModule('HelloService');
        const res = await fetch(runtime.baseUrl + '?name=World');
        const text = await res.text();
        assert.strictEqual(text, 'Hello, World');
    });

});
