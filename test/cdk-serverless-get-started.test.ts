

import { handler } from "../functions/apiRouter";


describe('Unit test for app', function () {
    it('test handler', async () => {

        const res = await handler(null,null);
        expect(res).toEqual("done");
    });
});