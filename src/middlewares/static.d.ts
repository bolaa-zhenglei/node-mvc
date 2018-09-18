import Koa from 'koa'
import Application from '../classes/application'

declare interface Options {
    /**
     * 当请求的地址是一个目录时，默认访问的文件名
     */
    default?: string | string[]
}

declare function Middleware(options: Options, app: Application): Koa.Middleware

export = Middleare