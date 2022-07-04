



const postHandler = require('../src/handlers/post')
// describe('Unit test for app', function () {

//     beforeAll(() => {

//     })
//     // it('test apiRouter handler', async () => {

//     //     const res = await apiHandler(null,null);
//     //     expect(res).toEqual("done");
//     // });

//     it('test post handler', async () => {
     
async function run() {
    const it = 'italianstallion26.21@gmail.com';
    const jared = 'jaredfranzone@gmail.com';

    const res = await postHandler.handler({email: it, postCommand: "RunSimulation" }, null);
}
run().then(() => {
    console.log('all done')
})

//         expect(res).toEqual("done");
//     }, 600000);


//     // it('test delete handler', async () => {

//     //     const res = await deleteHandler(null,null);
//     //     expect(res).toEqual("done");
//     // });
// });