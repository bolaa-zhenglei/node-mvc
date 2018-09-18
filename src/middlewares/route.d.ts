import Koa from 'koa'
import Application from '../classes/application'

declare interface Options {
    /**
     * 当访问根路径时要转向的控制器
     */
    rootController?: string
}

declare function Middleware(options: Options, app: Application): Koa.Middleware

export = Middleare