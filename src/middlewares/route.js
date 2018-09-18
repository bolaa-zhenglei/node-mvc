'use strict'

const Application = require('../classes/application')
const Controller = require('../classes/controller')
const utils = require('../utils')
const path = require('path')
const extend2 = require('extend2')

/**
 * 路由中间件
 * @param {*} options 
 * @param {Application} app
 */
module.exports = (options, app) => {
    if (!utils.dirExistsSync(app.paths.controllers)) {
        //如果控制器目录不存在，返回一个空的中间件
        return async (ctx, next) => {
            await next()
        }
    }

    options = extend2(true, {}, options, {
        rootController: 'home'
    })

    //加载控制器文件
    let list = utils.requireAll(app.paths.controllers, '/', true)

    //筛选有效的控制器
    list = list.filter(item => {
        return typeof (item.content) === 'function' && Controller.isPrototypeOf(item.content)
    })

    //构建正则匹配串
    const controllers = list.map(item => {
        return {
            rule: new RegExp('^' + item.path + '(/|$)'),
            content: item.content
        }
    })

    //创建根目录控制器
    if (options.rootController) {
        let rootController = list.find(t => t.path === '/' + options.rootController)
        if (rootController) {
            controllers.unshift({
                rule: /^\/$/,
                content: rootController.content
            })
        }
    }

    return async (ctx, next) => {
        let matchedController = controllers.find(item => item.rule.test(ctx.path))
        if (matchedController) {
            //路由成功
            let controllerPath = matchedController.rule.exec(ctx.path)[0]
            let params = ctx.path.substr(controllerPath.length)
            if(!controllerPath.endsWith('/')) {
                controllerPath += '/'
            }
            if(params.startsWith('/')) {
                params = params.substr(1)
            }

            //拆分路由参数
            params = params.split('/')
            let action = params[0]
            params.shift()

            ctx.route = {
                controller: controllerPath,
                action,
                params,
                controllerClass: matchedController.content
            }
        }

        await next()
    }
}