const postHandler = require('../src/handlers/post')
     
async function run() {
    const it = 'italianstallion26.21@gmail.com';
    const jared = 'jaredfranzone@gmail.com';
    const res = await postHandler.handler({email: it, postCommand: "RunSimulation" }, null);
}
run().then(() => {
    console.log('done')
})