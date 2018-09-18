'use strict'

const extend2 = require('extend2')
const mysql = require('mysql')

/**
 * MySQL查询实例
 */
class MysqlInstance {
    /**
     *
     * @param {*} conn 原生mysql连接实例
     */
    constructor(conn) {
        this._conn = conn
    }

    query(sql, values) {
        return new Promise((resolve, reject) => {
            this._conn.query(sql, values || [], (err, results, fields) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(results)
                }
            })
        })
    }

    async queryOne(sql, values) {
        let results = await this.query(sql, values)
        return results[0] || null
    }

    async queryField(sql, values) {
        let result = await this.queryOne(sql, values)
        if(!result) {
            return null
        }
        for(let n in result) {
            return result[n]
        }
        return null
    }

    async insert(table, fields, replace) {
        let columnNames = []
        let columns = []
        let valuesNames = []
        let values = []
        for (let n in fields) {
            columnNames.push('??')
            valuesNames.push('?')
            columns.push(n)
            values.push(fields[n])
        }

        let sql = (replace ? 'REPLACE' : 'INSERT') + ' INTO ?? (' +
            columnNames.join(',') +
            ') VALUES (' +
            valuesNames.join(',') +
            ');'
        return (await this.query(sql, [table].concat(columns).concat(values))).insertId
    }

    async update(table, fields, where) {
        let columns = []
        let whereColumns = []
        let values = [table]

        let sql = 'UPDATE ?? SET '
        for (let n in fields) {
            if(typeof(fields[n]) === 'undefined') continue
            columns.push('?? = ?')
            values.push(n)
            values.push(fields[n])
        }
        sql += columns.join(',')

        if (where) {
            for (let n in where) {
                if(typeof(where[n]) === 'undefined') continue
                whereColumns.push('?? = ?')
                values.push(n)
                values.push(where[n])
            }
            if (whereColumns.length > 0) {
                sql += ' WHERE ' + whereColumns.join(' AND ')
            }
        }

        return await this.query(sql, values)
    }

    async get(table, where) {
        let sql = 'SELECT * FROM ?? '
        let values = [table]
        if (where) {
            let whereColumns = []
            for (let n in where) {
                if(typeof(where[n]) === 'undefined') continue
                whereColumns.push('?? = ?')
                values.push(n)
                values.push(where[n])
            }
            if (whereColumns.length > 0) {
                sql += ' WHERE ' + whereColumns.join(' AND ')
            }
        }
        sql += ' LIMIT 1'
        return await this.queryOne(sql, values)
    }

    async select(table, where) {
        let sql = 'SELECT * FROM ?? '
        let values = [table]
        if (where) {
            let whereColumns = []
            for (let n in where) {
                if(typeof(where[n]) === 'undefined') continue
                whereColumns.push('?? = ?')
                values.push(n)
                values.push(where[n])
            }
            if (whereColumns.length > 0) {
                sql += ' WHERE ' + whereColumns.join(' AND ')
            }
        }
        return await this.query(sql, values)
    }

    /**
     * 对值进行转义
     * @param {string} v 要转义的值
     */
    escape(v) {
        return mysql.escape(v)
    }

    /**
     * 对标识进行转义
     * @param {string} v 要转义的标识
     * @returns {string}
     */
    escapeId(v) {
        return mysql.escapeId(v)
    }

    /**
     * 格式化查询字符串
     * @param {string} sql 查询字符串
     * @param {any[]} values 参数列表
     */
    format(sql, values) {
        return mysql.format(sql, values)
    }

    like(field, value, connector = 'AND') {
        if(!value) return ''
        let v = String(value).trim()
        if(v.length == 0) return ''
        let parts = v.split(/\s+/ig)

        return '((' + parts.filter(part => !!part).map(part => {
            return this.format('?? LIKE ?', [
                field,
                '%' + part.replace(/[%_]/ig, found => '\\' + found) + '%'
            ])
        }).join(') ' + connector + ' (') + '))'
    } 
}

/**
 * 封装的数据库连接实例
 */
class MysqlConnection extends MysqlInstance {}

/**
 * 开启了事务的数据库连接对象
 */
class MysqlTransactionConnection extends MysqlConnection {
    /**
     * 提交数据库事务
     */
    commit() {
        return new Promise((resolve, reject) => {
            this._conn.commit(err => {
                err ? reject(err) : resolve()
            })
        })
    }

    /**
     * 回滚数据库事务
     */
    rollback() {
        return new Promise(resolve => {
            this._conn.rollback(resolve)
        })
    }

    /**
     * 关闭连接
     */
    end() {
        return new Promise((resolve, reject) => {
            if (typeof this._conn.release === 'function') {
                this._conn.release()
                resolve()
            } else {
                this._conn.end(err => {
                    if (err) {
                        reject(err)
                    } else {
                        resolve()
                    }
                })
            }
        })
    }
}

class MysqlPool extends MysqlInstance {
    constructor(config) {
        config = extend2(true, {
            charset: 'utf8mb4',
            supportBigNumbers: true,
            typeCast(field, next) {
                if(field.type === 'TIMESTAMP' || field.type === 'DATE' || field.type === 'DATETIME') {
                    let v = field.string()
                    if(!v) {
                        return null
                    }
                    else {
                        return Date.parse(v)
                    }
                }
                else {
                    return next()
                }
            }
        }, config)
        super(mysql.createPool(config))
    }

    /**
     * 开启一个数据库事务
     * @param {Function} scope 需要在其中执行数据库查询的闭包方法，如果不传此参数则直接返回连接实例
     * @returns {Promise<MysqlTransactionConnection>}
     */
    beginTransaction(scope) {
        return new Promise((resolve, reject) => {
            this._conn.getConnection(async (err, connection) => {
                if (err) {
                    reject(err)
                    return
                }

                let connParam = new MysqlConnection(connection)
                let connControl = new MysqlTransactionConnection(connection)

                connection.beginTransaction(async errTrans => {
                    if (errTrans) {
                        await connControl.end()
                        reject(errTrans)
                        return
                    }

                    if (typeof scope === 'function') {
                        let ret, error
                        try {
                            ret = await scope(connParam)
                            await connControl.commit()
                        } catch (e) {
                            await connControl.rollback()
                            error = e
                        }

                        await connControl.end()

                        if (error) {
                            reject(error)
                        } else {
                            resolve(ret)
                        }
                    } else {
                        resolve(connControl)
                    }
                })
            })
        })
    }

    /**
     * 关闭连接
     */
    end() {
        return new Promise((resolve, reject) => {
            this._conn.end(err => {
                if (err) {
                    reject(err)
                } else {
                    resolve()
                }
            })
        })
    }
}

module.exports = MysqlPool
