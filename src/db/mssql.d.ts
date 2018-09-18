import Mssql from 'mssql'

declare interface Fields {
    [name: string]: any
}

/**
 * 提供基础查询功能的SQLSever连接对象
 */
declare class IQuery {
    /**
     * 执行SQL操作
     * @param sql 要执行的SQL语句
     * @param params 参数值
     */
    query(sql: string, params?: Fields): Promise<Mssql.IResult<any>>

    /**
     * 执行SQL操作并返回第一个结果集
     * @param sql 要执行的SQL语句
     * @param params 参数值
     */
    querySingle(sql: string, params?: Fields): Promise<Mssql.IRecordSet<any>>

    /**
     * 执行SQL操作并返回第一行的结果
     * @param sql 要执行的SQL语句
     * @param params 参数值
     */
    queryOne(sql: string, params?: Fields): Promise<any>

    /**
     * 执行SQL操作并返回第一行第一列的结果
     * @param sql 要执行的SQL语句
     * @param values SQL语句内参数替换的值
     */
    queryField(sql: string, params?: Fields): Promise<any>

    /**
     * 向指定的表中插入一行
     * @param table 表名
     * @param fields 字段值
     */
    insert(table: string, fields: Fields): Promise<Number>

    /**
     * 更新表中的记录
     * @param table 表名
     * @param fields 要替换的字段值
     * @param where 查询条件
     */
    update(table: string, fields: Fields, where: Fields): Promise<Number>

    /**
     * 从指定的表中删除记录
     * @param table 表名
     * @param where 查询条件
     */
    delete(table: string, where: Fields): Promise<Number>
}

declare class MssqlTransactionConnection extends IQuery {
    /**
     * 提交数据库
     */
    commit(): Promise<void>

    /**
     * 回滚数据库
     */
    rollback(): Promise<void>
}

declare type TransactionScope = (conn: IQuery) => Promise<any>

declare class MssqlPool extends IQuery {
    /**
     * 初始化SQLServer数据库连接对象
     * @param config 数据库连接配置对象
     */
    constructor(config: Mssql.config)

    /**
     * 关闭连接
     */
    end(): Promise<void>

    /**
     * 开启一个数据库事务
     */
    beginTransaction(): Promise<MssqlTransactionConnection>

    /**
     * 开启一个数据库事务
     * @param scope 需要在其中执行数据库查询的闭包方法
     */
    beginTransaction(scope: TransactionScope): Promise<any>
}

export = MssqlPool