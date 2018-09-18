'use strict'

const mssql = require('mssql')

class MssqlInstance {
    /**
     * 
     * @param {mssql.Request} request 
     */
    constructor(request) {
        this._request = request
    }

    /**
     * 执行SQL操作
     * @param sql 要执行的SQL语句
     * @param params 参数值
     */
    async query(sql, params) {
        if(params) {
            for (let n in params) {
                if(typeof(n) === 'undefined') {
                    this._request.input(n, params[n])
                }
            }
        }

        return await this._request.query(sql)
    }

    async querySingle(sql, params) {
        return (await this.query(sql, params)).recordset
    }

    async queryOne(sql, params) {
        let recordset = await this.querySingle(sql, params)
        if(recordset.length > 0) {
            return recordset[0]
        }
    }

    async queryField(sql, params) {
        let row = await this.queryOne(sql, params)
        if(row) {
            for(let n in row) {
                return row[n]
            }
        }
    }

    async insert(table, fields) {
        let columns = []
        let values = []
        for(let n in fields) {
            if(typeof(fields[n]) === 'undefined') {
                continue
            }
            columns.push(n)
            values.push('@' + n)
        }

        let sql = `INSERT INTO ${table} (${columns.join(',')}) VALUES (${values.join(',')}) SELECT @@IDENTITY`
        return await this.queryField(sql, fields)
    }

    async update(table, fields, where) {
        let updateColumns = []
        let whereColumns = []
        let paramId = 1
        let params = {}

        for(let n in fields) {
            if(typeof(fields[n]) === 'undefined') {
                continue
            }
            updateColumns.push(`${n} = @p${paramId}`)
            params['p' + paramId] = fields[n]
            paramId++
        }

        if(updateColumns.length === 0) {
            return 0
        }

        for (let n in where) {
            if (typeof (where[n]) === 'undefined') {
                continue
            }
            if(where[n] === null) {
                whereColumns.push(`(${n} IS NULL`)
            }
            else {
                whereColumns.push(`(${n} = @p${paramId})`)
                params['p' + paramId] = where[n]
                paramId++
            }
            
        }

        let sql = `UPDATE ${table} SET ${updateColumns.join(',')}`
        if(whereColumns.length > 0) {
            sql += ` WHERE ${whereColumns.join(' AND ')}`
        }

        let ret = await this.query(sql, params)
        return ret.rowsAffected[0]
    }

    async delete(table, where) {
        let whereColumns = []
        for (let n in where) {
            if (typeof (where[n]) === 'undefined') {
                continue
            }
            if (where[n] === null) {
                whereColumns.push(`(${n} IS NULL`)
            }
            else {
                whereColumns.push(`(${n} = @${n})`)
            }
        }

        let sql = `DELETE FROM ${table}`
        if (whereColumns.length > 0) {
            sql += ` WHERE ${whereColumns.join(' AND ')}`
        }

        let ret = await this.query(sql, where)
        return ret.rowsAffected[0]
    }
}

class MssqlTransactionInnerConnection {
    /**
     * 
     * @param {mssql.Transaction} transaction
     * @param {mssql.Request} request
     */
    constructor(transaction) {
        this._transaction = transaction
    }

    async query(sql, params) {
        return await new MssqlInstance(new mssql.Request(this._transaction)).query(sql, params)
    }

    async querySingle(sql, params) {
        return await new MssqlInstance(new mssql.Request(this._transaction)).querySingle(sql, params)
    }

    async queryOne(sql, params) {
        return await new MssqlInstance(new mssql.Request(this._transaction)).queryOne(sql, params)
    }

    async queryField(sql, params) {
        return await new MssqlInstance(new mssql.Request(this._transaction)).queryField(sql, params)
    }

    async insert(table, fields) {
        return await new MssqlInstance(new mssql.Request(this._transaction)).insert(table, fields)
    }

    async update(table, fields, where) {
        return await new MssqlInstance(new mssql.Request(this._transaction)).update(table, fields, where)
    }

    async delete(table, where) {
        return await new MssqlInstance(new mssql.Request(this._transaction)).delete(table, where)
    }
}

class MssqlTransactionConnection extends MssqlTransactionInnerConnection {
    /**
     * 
     * @param {mssql.Transaction} transaction
     */
    constructor(transaction) {
        super(transaction)
    }

    commit() {
        return this._transaction.commit()
    }

    rollback() {
        return this._transaction.rollback()
    }
}

class MssqlPool {

    constructor(poolConfig) {
        this.pool = new mssql.ConnectionPool(poolConfig)
        this._connectPromise = null
    }

    waitConnect() {
        if(this.pool.connected) {
            return Promise.resolve()
        }
        if(this._connectPromise) {
            return this._connectPromise
        }
        else {
            return this._connectPromise = this.pool.connect()
        }
    }

    async query(sql, params) {
        await this.waitConnect()
        return new MssqlInstance(this.pool.request()).query(sql, params)
    }

    async querySingle(sql, params) {
        await this.waitConnect()
        return await new MssqlInstance(this.pool.request()).querySingle(sql, params)
    }

    async queryOne(sql, params) {
        await this.waitConnect()
        return await new MssqlInstance(this.pool.request()).queryOne(sql, params)
    }

    async queryField(sql, params) {
        await this.waitConnect()
        return await new MssqlInstance(this.pool.request()).queryField(sql, params)
    }

    async insert(table, fields) {
        await this.waitConnect()
        return await new MssqlInstance(this.pool.request()).insert(table, fields)
    }

    async update(table, fields, where) {
        await this.waitConnect()
        return await new MssqlInstance(this.pool.request()).update(table, fields, where)
    }

    async delete(table, where) {
        await this.waitConnect()
        return await new MssqlInstance(this.pool.request()).delete(table, where)
    }

    async end() {
        await this.pool.close()
        this._connectPromise = null
    }

    beginTransaction(scope) {
        return new Promise(async (resolve, reject) => {
            this.waitConnect().catch(reject).then(() => {
                //创建事务
                const transaction = new mssql.Transaction(this.pool)

                transaction.begin(async err => {
                    if(err) {
                        reject(err)
                    }
                    else {
                        if (typeof (scope) === 'function') {
                            const conn = new MssqlTransactionInnerConnection(transaction)
                            let ret, transError
                            try {
                                ret = await scope(conn)
                            }
                            catch (e) {
                                transError = e
                            }

                            if(transError) {
                                //事务中出现异常
                                await transaction.rollback()
                                reject(transError)
                            }
                            else {
                                await transaction.commit()
                                resolve(ret)
                            }
                        }
                        else {
                            resolve(new MssqlTransactionConnection(transaction))
                        }
                    }
                })
            })

            

            
        })
    }
}

module.exports = MssqlPool