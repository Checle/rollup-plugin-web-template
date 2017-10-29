import window from './window.js'
import code from './code/index.js'
import codeHTML from './code/html/index.js'
import codeImage from './code/image.js'
import codeStyle from './code/style.js'
import codeHTMLForJS from './code/html/js.js'
import Processor from './processor.js'
import {escapeCode, getURL} from './utils.js'

var {realpathSync, realpath} = require('fs')
var {sep} = require('path')
var DataURI = require('datauri')
var createDataURI = DataURI.promise

export default class Transformer {
  imports
  link
  includes
  excludes
  plugins
  id
  document = null

  constructor (imports, link, includes, excludes) {
    this.imports = imports
    this.link = link
    this.includes = includes.map(p => realpathSync(p))
    this.excludes = excludes.map(p => realpathSync(p))
  }

  config (id, plugins) {
    this.id = id
    this.plugins = plugins
  }

  async transform(code, id) {
    let ext = id.substr(id.lastIndexOf('.') + 1)

    switch (ext) {
      case 'html':
      return await this.transformHTML(code, id)

      case 'gif':
      case 'jpeg':
      case 'jpg':
      case 'png':
      case 'svg':
      return await this.transformImage(code, id)

      case 'css':
      return await this.transformStyle(code, id)
    }

    return code
  }

  async transformImage(code, id) {
    let uri = await createDataURI(id) // TODO: avoid double loading
    return codeImage(uri)
  }

  async transformStyle(code, id) {
    let uri = await createDataURI(id) // TODO: avoid double loading
    return codeStyle(uri)
  }

  async include(id) {
    let pathname = await new Promise((resolve, reject) => realpath(id, (error, pathname) => error ? reject(error) : resolve(pathname)))

    for (let exclude of this.excludes) {
      if (exclude === pathname || pathname.startsWith(exclude) && pathname[exclude.length] === sep) {
        return false
      }
    }

    for (let include of this.includes) {
      if (include === pathname || pathname.startsWith(include) && pathname[include.length] === sep) {
        return true
      }
    }

    return !this.link
  }

  async transformHTML(html, id) {
    let imports = []
    let url = getURL(id)
    let document = new window.DOMParser().parseFromString(html, 'text/html')

    let imp = childID => {
      if (id !== childID) imports.push(childID)
    }

    let processor = new Processor(imp, this, url)
    await processor.processDocument(document, url.href)

    html = new window.XMLSerializer().serializeToString(document)

    if (id === this.id) {
      this.document = document

      imports = this.imports.concat(imports)

      return code(imports)
    }

    return codeHTML(html, imports)
  }

  transformBundle(code, type, format) {
    let document = this.document
    let script

    if (type === 'html' || type === 'js' && document !== null) {
      if (document === null) document = new window.DOMParser().parseFromString('', 'text/html')

      if (format !== 'es') {
        script = document.createElement('SCRIPT')

        if (format === 'module') script.setAttribute('type', 'module')
        else script.setAttribute('defer', '')

        let du = new DataURI()
        du.format('.js', code)

        script.innerHTML = ''
        script.src = du.content

        document.head.insertBefore(script, document.head.firstChild)
      }

      let html = new window.XMLSerializer().serializeToString(document)

      if (script !== undefined) document.head.removeChild(script)
      if (type === 'js') return codeHTMLForJS(html)
      else return html
    }
  }
}
