'use strict'

const Koa = require('koa')
const path = require('path')
const utils = require('../utils')
const extend2 = require('extend2')
const Mssql = require('../db/mssql')
const Mysql = require('../db/mysql')
const requireAll = require('require-all')
const middlewareLoader = require('../middleware-loader')
const http = require('http')

module.exports = class Application extends Koa {
    constructor(root, env) {
        if (!root) {
            throw new Error('应用程序根路径未定义')
        }
        super()
        if(typeof(env) === 'string' && !env) {
            this.env = env
        }

        //构建应用程序路径配置对象
        if (typeof (root) === 'string') {
            this.paths = {
                root
            }
        }
        else if (typeof (root) === 'object') {
            this.paths = root
        }
        else {
            throw new Error('应用程序根路径未定义')
        }

        if (typeof (this.paths.root) !== 'string') {
            throw new Error('应用程序根路径未定义')
        }

        this.paths.root = path.resolve(this.paths.root)
        this.paths.wwwroot = typeof (this.paths.wwwroot) === 'string' ? path.resolve(this.paths.wwwroot) : path.resolve(this.paths.root, './wwwroot')
        this.paths.source = typeof (this.paths.source) === 'string' ? path.resolve(this.paths.source) : path.resolve(this.paths.root, './src')
        this.paths.config = typeof (this.paths.config) === 'string' ? path.resolve(this.paths.config) : path.resolve(this.paths.source, './config')
        this.paths.controllers = typeof (this.paths.controllers) === 'string' ? path.resolve(this.paths.controllers) : path.resolve(this.paths.source, './controllers')
        this.paths.middlewares = typeof (this.paths.middlewares) === 'string' ? path.resolve(this.paths.middlewares) : path.resolve(this.paths.source, './middlewares')
        this.paths.services = typeof (this.paths.services) === 'string' ? path.resolve(this.paths.services) : path.resolve(this.paths.source, './services')
        this.paths.jobs = typeof (this.paths.jobs) === 'string' ? path.resolve(this.paths.jobs) : path.resolve(this.paths.source, './jobs')
        this.paths.views = typeof (this.paths.views) === 'string' ? path.resolve(this.paths.views) : path.resolve(this.paths.source, './views')

        //加载配置对象
        this.config = utils.tryRequire(this.paths.config)
        //加载环境特定配置对象
        this.config = extend2(true, this.config, utils.tryRequire(path.resolve(this.paths.config, `./${this.env}`)))

        //加载数据库适配器
        if (this.config.db) {
            if(this.config.db.mysql) {
                this.mysql = new Mysql(this.config.db.mysql)
            }
            if(this.config.db.mssql) {
                this.mssql = new Mssql(this.config.db.mssql)
            }
        }

        //加载服务程序
        this.services = {}
        if (utils.dirExistsSync(this.paths.services)) {
            let serviceClasses = requireAll({
                dirname: this.paths.services,
                filter: /^([^\.].*)\.js$/
            })

            for (let n in serviceClasses) {
                this.services[n] = new serviceClasses[n](this)
            }
        }

        //加载中间件
        this.use(middlewareLoader(this))
    }

    /**
     * 启动应用程序
     */
    run(port) {
        if(typeof(port) !== 'number') {
            port = this.config.port
        }

        if(typeof(port) !== 'number') {
            port = 3000
        }

        const server = http.createServer(this.callback())
        return new Promise((resolve, reject) => {
            server.on('error', err => {
                reject(err)
            })
            server.listen(port, () => {
                resolve(server)
            })
        })
    }
}