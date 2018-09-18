'use strict'

const path = require('path')
const fs = require('fs')

const utils = {
    tryRequire(libPath, fallback = {}) {
        try {
            const content = require(libPath)
            return content || fallback
        }
        catch (e) {
            return fallback
        }
    },

    requireElse(...libPaths) {
        if(libPaths.length === 0) return
        for(let i = 0; i < libPaths.length; i++) {
            try {
                return require(libPaths[i])
            }
            catch (e) {
                
            }
        }
    },

    requireAll(dir, base = '/', ignoreSameNameFolder = false) {
        dir = path.resolve(dir)
        let entries = fs.readdirSync(dir)

        let list = []
        let includedFiles = []

        //处理文件
        entries.forEach(entry => {
            if (!entry.endsWith('.js')) {
                return
            }
            let fullPath = path.resolve(dir, entry)
            let stat = fs.statSync(fullPath)
            if(!stat.isFile()) {
                return
            }

            let basename = entry.substr(0, entry.length - 3)
            list.push({
                path: base + basename,
                content: require(fullPath)
            })
            includedFiles.push(basename)
        })

        //处理目录
        entries.forEach(entry => {
            let fullPath = path.resolve(dir, entry)
            let stat = fs.statSync(fullPath)
            if (!stat.isDirectory()) {
                return
            }

            if (ignoreSameNameFolder && includedFiles.indexOf(entry) != -1) {
                return
            }

            list = list.concat(utils.requireAll(fullPath, base + entry + '/', ignoreSameNameFolder))
        })

        return list
    },

    dirExistsSync(dir) {
        try {
            return fs.statSync(dir).isDirectory()
        }
        catch (e) {
            return false
        }
    }
}

module.exports = utils