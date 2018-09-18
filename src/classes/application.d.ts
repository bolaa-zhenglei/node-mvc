import Koa from 'koa'
import Processor from './processor'
import http from 'http'
import Mysql from '../db/mysql'
import Mssql from '../db/mssql'

/**
 * 应用程序路径定义对象
 */
declare interface ApplicationPaths {
    /**
     * 应用程序根路径
     */
    root: string

    /**
     * 代码文件根路径
     */
    source: string

    /**
     * 静态文件根路径
     */
    wwwroot: string

    /**
     * 配置文件根路径
     */
    config: string

    /**
     * 控制器根路径
     */
    controllers: string

    /**
     * 中间件根路径
     */
    middlewares: string

    /**
     * 服务类代码根路径
     */
    services: string

    /**
     * 定时任务代码根路径
     */
    jobs: string

    /**
     * 视图根路径
     */
    view: string
}

declare module Application {
    /**
     * 应用程序路径配置对象
     */
    interface PathOptions {
        /**
         * 应用程序根路径
         */
        root: string

        /**
         * 代码文件根路径
         */
        source?: string

        /**
         * 静态文件根路径
         */
        wwwroot?: string

        /**
         * 配置文件根路径
         */
        config?: string

        /**
         * 控制器根路径
         */
        controllers?: string

        /**
         * 中间件根路径
         */
        middlewares?: string

        /**
         * 服务类代码根路径
         */
        services?: string

        /**
         * 定时任务代码根路径
         */
        jobs?: string

        /**
         * 视图根路径
         */
        views?: string
    }
}

declare interface Services {
    [name: string]: Processor
}

declare type MiddlewareCreator = (...params: any[]) => Koa.Middleware

/**
 * 应用程序配置对象
 */
declare interface ApplicationConfig {
    port?: number

    middlewares?: any[]
}

declare class Application extends Koa {

    /**
     * 初始化一个应用程序实例
     * @param root 应用程序根路径
     * @param env 覆盖的应用程序环境标识
     */
    constructor(root: string, env?: string)

    /**
     * 初始化一个应用程序实例
     * @param pathOptions 应用程序路径配置对象
     * @param env 覆盖的应用程序环境标识
     */
    constructor(pathOptions: Application.PathOptions, env?: string)

    /**
     * 应用程序路径定义对象
     */
    paths: ApplicationPaths

    /**
     * 服务定义对象
     */
    services: Services

    /**
     * 配置对象
     */
    config: ApplicationConfig

    /**
     * MySQL数据库连接对象
     */
    mysql?: Mysql

    /**
     * SQLServer数据库连接对象
     */
    mssql?: Mssql

    /**
     * 启动服务器
     * @param port 端口，如果传入此值将覆盖配置文件中的值
     */
    run(port?: number): Promise<http.Server>
}

export = Application