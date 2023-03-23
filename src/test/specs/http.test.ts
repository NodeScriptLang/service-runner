import assert from 'assert';

import { runtime } from '../runtime.js';

describe('Http Service Runner', () => {

    it('returns the expected response from Hello Service', async () => {
        runtime.setModule('HelloService');
        const res = await fetch(runtime.baseUrl + '?name=World');
        const text = await res.text();
        
        assert.strictEqual(res.status, 200)
        assert.strictEqual(text, 'Hello, World');
    });
    
    it('returns undefined text from Hello Service when param name is incorrect', async () => {
        runtime.setModule('HelloService');
        const res = await fetch(runtime.baseUrl + '?foo=World');
        const text = await res.text();
        
        assert.strictEqual(res.status, 200)
        assert.strictEqual(text, 'Hello, undefined');
    });
    
    it('returns 500 when module URL is incorrect', async () => {
        runtime.setModule('NotFoundModule');
        const res = await fetch(runtime.baseUrl + '?name=World');
        
        assert.strictEqual(res.status, 500);
    });

});
