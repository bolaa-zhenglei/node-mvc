'use strict'

const extend2 = require('extend2')

module.exports = (options) => {

    options = extend2(true, {}, options, {
        defaultAction: 'index'
    })

    return async (ctx, next) => {
        if(ctx.route) {
            let controller = new ctx.route.controllerClass(ctx.app, ctx)
            let action = ctx.route.action || options.defaultAction
            if((await controller.__before(action)) !== false) {
                let resp
                if(typeof(controller[action]) === 'function') {
                    let err
                    try {
                        resp = await controller[action].apply(controller, ctx.route.params)
                    }
                    catch (e) {
                        ctx.status = 500
                        throw e
                    }

                    if (ctx.status === 404) {
                        ctx.status = 200
                    }

                    try {
                        await controller.__after(action)
                    }
                    catch (e) {
                        ctx.status = 500
                        throw e
                    }
                }
                else {
                    try {
                        resp = await controller.__action.apply(controller, [ action ].concat(ctx.route.params))
                    }
                    catch (e) {
                        ctx.status = 500
                        throw e
                    }
                }

                if (typeof (resp) !== 'undefined') {
                    ctx.body = resp
                }

                
            }
        }
        
        await next()
    }
}