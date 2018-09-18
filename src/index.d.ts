import Mssql from './db/mssql'
import Mysql from './db/mysql'
import Application from './classes/application'
import Processor from './classes/processor'
import Controller from './classes/controller'
import http from 'http'

declare interface RunResult {
    app: Application

    server: http.Server
}

/**
 * 
 * @param root 应用程序根目录
 * @param port 监听的端口，传递此参数则覆盖配置文件中的值
 */
declare function run(root: string, port?: number): Promise<RunResult>

/**
 * 
 * @param root 应用程序根目录配置对象
 * @param port 监听的端口，传递此参数则覆盖配置文件中的值
 */
declare function run(root: Application.PathOptions, port?: number): Promise<RunResult>

/**
 * 
 * @param app 应用程序实例
 * @param port 监听的端口，传递此参数则覆盖配置文件中的值
 */
declare function run(app: Application, port?: number): Promise<RunResult>

export = {
    Application,

    Processor,

    Controller,

    DB: {
        Mysql,
        Mssql
    },

    run
}