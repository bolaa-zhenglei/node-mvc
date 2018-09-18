import Mysql from 'mysql'

declare interface Fields {
    [name: string]: any
}

declare interface ChangeResult {
    affectedRows: Number
}

declare interface UpdateResult extends ChangeResult {
    changedRows: Number
}

declare class MysqlInstance {
    /**
     * @param conn 原生mysql连接实例
     */
    constructor(conn: Mysql.Connection)

    /**
     * 执行SQL操作
     * @param sql 要执行的SQL语句
     * @param values SQL语句内参数替换的值
     */
    query(sql: string, values?: Array<any>): Promise<any>

    /**
     * 执行SQL操作并返回第一行的结果
     * @param sql 要执行的SQL语句
     * @param values SQL语句内参数替换的值
     */
    queryOne(sql: string, values?: Array<any>): Promise<any>

    /**
     * 执行SQL操作并返回第一行第一列的结果
     * @param sql 要执行的SQL语句
     * @param values SQL语句内参数替换的值
     */
    queryField(sql: string, values?: Array<any>): Promise<any>

    /**
     * 向指定的表中插入一行
     * @param table 表名
     * @param fields 字段值
     * @param replace 是否使用REPLACE INTO
     */
    insert(table: string, fields: Fields, replace?: boolean): Promise<Number>

    /**
     * 更新表中的记录
     * @param table 表名
     * @param fields 要替换的字段值
     * @param where 查询条件
     */
    update(table: string, fields: Fields, where: Fields): Promise<UpdateResult>

    /**
     * 从指定的表中删除记录
     * @param table 表名
     * @param where 查询条件
     */
    delete(table: string, where: Fields): Promise<ChangeResult>

    /**
     * 对值进行转义
     * @param v 要转义的值
     */
    escape(v: string): string

    /**
     * 对标识进行转义
     * @param v 要转义的标识
     */
    escapeId(v: string): string

    /**
     * 格式化查询字符串
     * @param sql 查询字符串
     * @param values 参数列表
     */
    format(sql: string, values: Array<any>): string

    /**
     * 格式化LIKE表达式
     * @param field 字段名
     * @param value 搜索值
     * @param connector 连接条件，默认为AND
     */
    like(field: string, value: string, connector?: string): string
}

/**
 * 封装了事务的数据库连接实例
 */
declare class MysqlTransactionConnection extends MysqlInstance {
    /**
     * 提交数据库事务
     */
    commit(): Promise<void>

    /**
     * 回滚数据库事务
     */
    rollback(): Promise<void>
}

/**
 * 开启了事务的数据库连接对象
 */
declare class MysqlPoolTransactionConnection extends MysqlTransactionConnection {
    /**
     * 关闭连接
     */
    end(): Promise<void>
}

declare type TransactionScope = (conn: MysqlTransactionConnection) => Promise<any>

declare class MysqlPool extends MysqlInstance {
    constructor(config: Mysql.PoolConfig)

    /**
     * 开启一个数据库事务
     */
    beginTransaction(): Promise<MysqlPoolTransactionConnection>

    /**
     * 开启一个数据库事务
     * @param scope 需要在其中执行数据库查询的闭包方法
     */
    beginTransaction(scope: TransactionScope): Promise<void>

    /**
     * 关闭连接
     */
    end(): Promise<void>
}

export = MysqlPool