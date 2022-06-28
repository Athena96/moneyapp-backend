

import { lambdaHandler } from "../functions/function";


describe('Unit test for app', function () {
    it('test handler', async () => {

        const res = await lambdaHandler(null,null);
        expect(res).toEqual('Success');
    });
});