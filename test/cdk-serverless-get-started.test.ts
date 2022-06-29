

import { handler as apiHandler } from "../src/handlers/apiRouter";
import { handler as postHandler} from "../src/handlers/post";
import { handler as deleteHandler} from "../src/handlers/delete";


describe('Unit test for app', function () {

    beforeAll(() => {
        process.env['POOL_ID'] = "test"

    })
    it('test apiRouter handler', async () => {

        const res = await apiHandler(null,null);
        expect(res).toEqual("done");
    });

    it('test post handler', async () => {
        const res = await postHandler(null,null);
        expect(res).toEqual("done");
    });


    it('test delete handler', async () => {

        const res = await deleteHandler(null,null);
        expect(res).toEqual("done");
    });
});