// const postHandler = require('../src/handlers/post')
// import {handler} from 
// const postHandler = require('./src/handlers/post')
const r = require('./src/handlers/post')
async function run() {
    // const it = 'italianstallion26.21@gmail.com';
    const jared = 'jaredfranzone@gmail.com';
  
    const res = await r.handler({email: jared, postCommand: "RunSimulation" }, null);
}
run().then(() => {
    console.log('done')
})