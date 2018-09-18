import { Context } from 'koa'
import Controller from './controller'

/**
 * 路由对象
 */
declare interface Route {
    /**
     * 匹配到的控制器名
     */
    controller: string

    /**
     * 匹配到的方法名
     */
    action: string

    /**
     * 匹配到的路由参数
     */
    params: string[]

    /**
     * 控制器类
     */
    controllerClass: typeof Controller
}

declare interface ExtendContext extends Context {
    /**
     * 当前解析到的路由对象
     */
    route?: Route
}

export = ExtendContext