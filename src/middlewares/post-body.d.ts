import KoaBody from 'koa-body'
import Application from '../classes/application'

declare function Middleware(options: KoaBody.IKoaBodyOptions, app: Application): Koa.Middleware

export = Middleare