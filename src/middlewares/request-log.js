'use strict'

const extend2 = require('extend2')

module.exports = options => {

    options = extend2(true, {}, options, {
        remoteAddress: false,
        host: false,
        response: false
    })

    return async (ctx, next) => {
        const timeStart = Date.now()

        let target = options.host ? ctx.href : ctx.path
        let method = ctx.method

        try {
            await next()
        }
        finally {

        }

        const elapsed = Date.now() - timeStart

        let log = ''
        if (options.remoteAddress) {
            log += `[FROM ${ctx.ip}] `
        }

        log += `[${method}] [${ctx.status}] [${elapsed}ms] ${target}`
        console.log(log)
        if (options.response) {
            console.log(ctx.body)
        }
    }
}