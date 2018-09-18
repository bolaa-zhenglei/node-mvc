'use strict'

const Application = require('./classes/application')

async function run(app, port) {
    if(!(app instanceof Application)) {
        app = new Application(app)
    }
    const server = await app.run(port)
    return {
        app,
        server
    }
}

module.exports = {
    Application,
    Processor: require('./classes/processor'),
    Controller: require('./classes/controller'),
    DB: {
        Mssql: require('./db/mssql'),
        Mysql: require('./db/mysql')
    },
    run
}