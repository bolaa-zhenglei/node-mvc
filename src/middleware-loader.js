'use strict'

const Application = require('./classes/application')
const isArray = require('is-array')
const utils = require('./utils')
const path = require('path')
const compose = require('koa-compose')

/**
 * 中间件加载器
 * @param {Application} app 
 */
module.exports = app => {
    /**
     * 定义的中间件列表
     */
    let middlewares = isArray(app.config.middlewares) ? app.config.middlewares : [
        'request-log',
        'route',
        'post-body',
        'action',
        'static'
    ]

    return compose(middlewares.map((item, index) => {
        if(typeof(item) === 'string') {
            item = {
                handler: item
            }
        }

        //尝试加载中间件初始化方法
        let handler = item.handler
        if(typeof(handler) === 'string') {
            handler = utils.requireElse(
                path.resolve(app.paths.middlewares, `./${handler}`),
                path.resolve(__dirname, `./middlewares/${handler}`),
                handler
            )
        }

        if(typeof(handler) !== 'function') {
            throw new Error(`无法加载中间件[${index}] ${item.handler}`)
        }

        //尝试加载中间件配置对象
        let options = typeof(item.options) === 'function' ? item.options(app) : item.options

        //实例化中间件
        let instance = handler(options, app)
        if(typeof(instance) !== 'function') {
            throw new Error(`无法实例化中间件[${index}] ${item.handler}`)
        }

        return async (ctx, next) => {
            let match = true
            if(typeof(item.match) === 'function') {
                match = !!item.match(ctx)
            }
            else if(typeof(item.match) === 'string') {
                match = ctx.path.startsWith(item.match)
            }
            else if(typeof(item.match) === 'undefined') {

            }
            else if(item.match) {
                if(item.match instanceof RegExp) {
                    match = item.match.test(ctx.path)
                }
            }
            else {
                match = false
            }

            if(match) {
                //启用中间件
                await instance(ctx, next)
            }
            else {
                //不启用中间件
                await next()
            }
        }
    }))
}