'use strict'

const body = require('koa-body')
const extend2 = require('extend2')
const utils = require('../utils')
const fs = require('fs')

module.exports = (options, app) => {

    options = extend2(true, {}, options, {
        multipart: true,
        formidable: {
            uploadDir: utils.dirExistsSync(app.paths.runtime) ? app.paths.runtime : undefined
        }
    })

    const bodyParser = body(options)

    return async (ctx, next) => {
        if (ctx.route && ctx.method === 'POST') {
            try {
                await bodyParser(ctx, next)
            }
            finally {
                //清理上传的文件
                if (ctx.request.files) {
                    for (let n in ctx.request.body.files) {
                        fs.unlink(ctx.request.body.files[n].path, () => {})
                    }
                }
            }

        }
        else {
            await next()
        }
    }
}