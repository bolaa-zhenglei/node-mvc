'use strict'

const Application = require('./application')

module.exports = class Processor {

    /**
     * 
     * @param {Application} app 
     */
    constructor(app) {
        this.app = app
    }
}