/**
 * 尝试引用一个文件
 * @param libPath 引用文件的路径
 * @param fallback 引用失败时返回的内容
 */
export function tryRequire(libPath: string, fallback?: any): any

/**
 * 尝试从一批路径中引用最新的一个能应用成功的路径
 * @param libPaths 引用文件的路径
 */
export function requireElse(...libPaths: string[]): any

declare interface Module {
    path: string

    content: any
}

/**
 * 加载路径下所有的模块
 * @param dir 要加载的路径
 * @param base 模块相对基路径
 * @param ignoreSameNameFolder 当文件已存在时，是否忽略同名的目录
 */
export function requireAll(dir: string, base?: string, ignoreSameNameFolder?: boolean): Module[]

/**
 * 判断目录是否存在
 * @param dir 目录完整路径
 */
export function dirExistsSync(dir: string): boolean