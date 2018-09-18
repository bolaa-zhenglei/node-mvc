import Koa from 'koa'

declare interface Options {
    /**
     * 未传递动作方法名时使用的默认方法名
     */
    defaultAction?: string
}

declare function Middleware(options: Options): Koa.Middleware

export = Middleare