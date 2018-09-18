import Application from './application'
import Processor from './processor'
import Context from './context'

/**
 * 控制器类
 */
class Controller extends Processor {
    /**
     * 初始化控制器类
     * @param app 应用程序实例
     * @param ctx Koa上下文实例
     */
    constructor(app: Application, public ctx: Context)

    /**
     * 动作方法执行前进行的前置操作，当该方法返回false或Promise<false>时，动作方法不会被执行
     * @param action 动作方法名
     */
    __before(action: string): Promise<boolean>

    /**
     * 动作方法执行后的操作
     * @param action 动作方法名
     */
    __after(action: string): Promise<void>

    /**
     * 无法找到对应的动作方法时进行的操作，此方法不应在控制器中主动调用
     * @param action 动作方法名
     * @param params url上附带的参数串
     */
    __action(action: string, ...params: string[]): Promise<any>
}

export = Controller