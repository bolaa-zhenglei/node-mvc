import Koa from 'koa'

declare interface Options {
    /**
     * 是否记录请求端IP地址
     */
    remoteAddress?: boolean

    /**
     * 是否记录完整的请求地址
     */
    host?: boolean

    /**
     * 是否记录响应内容
     */
    response?: boolean
}

declare function Middleware(options: Options): Koa.Middleware

export = Middleare