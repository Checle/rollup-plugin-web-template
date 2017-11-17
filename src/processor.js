import Plugin from './index.js'
import window from './window.js'
import {escapeCode, first, getData, getLocalPathname, getType, getURL} from './utils.js'

var acorn = require('acorn')
var escodegen = require('escodegen')
var DataURI = require('datauri')
var {URL} = require('whatwg-url')
var {realpath} = require('fs')
var {dirname, relative, resolve} = require('path').posix

let pathnames = new Set()
let cssRE = /(["'])(?:\\"|.)?\1|\/\*[\s\S]*?\*\/|(@import\s+|[:\s]url\(\s*)(?:(["']?)((?:\\[\s\S]|.)*)\3|([^);]*))/g
let codeTagNames = /^(?:PRE|SCRIPT|STYLE)$/
let {DOMParser, XMLSerializer, Text, Element, HTMLScriptElement, HTMLLinkElement, HTMLTemplateElement} = window

export default class Processor {
  constructor (importer, transformer, url) {
    this.import = importer
    this.transformer = transformer
    this.url = url
  }

  async include(url) {
    let pathname = getLocalPathname(url, this.url)
    if (pathname !== undefined) return await this.transformer.include(pathname)
    else return false
  }

  async processNode(root, url) {
    url = new URL(url)

    let pathname = decodeURIComponent(url.pathname)
    let node = root

    let getNext = node => {
      if (node.firstChild !== null) {
        if (!codeTagNames.test(node.tagName)) return node.firstChild
      }

      while (node.nextSibling === null) {
        if (node === root) return null

        node = node.parentNode
        if (node === null) return null
      }

      return node.nextSibling
    }

    let resolve = async (value) => {
      for (let plugin of this.transformer.plugins) {
        if (!plugin.resolveId) continue

        let result = await plugin.resolveId(value, pathname)
        if (result != null) return result
      }

      let u = new URL(value, url)
      if (u.protocol === 'file:' && u.host === '') return decodeURIComponent(u.pathname)
    }

    for (let next; node !== null; node = next) {
      next = getNext(node)

      if (node instanceof Element) {
        if (node instanceof HTMLScriptElement) {
          if (node.src === null) {
            let text
            if (node.type === 'module') text = this.processModuleText(node.innerHTML, url)
            else text = this.processScriptText(node.innerHTML, `\0${url.pathname}#.js`)

            node.innerHTML = escapeCode(text)
            node.removeAttribute('src')
          } else {
            if (node.type === 'module') {
              let u = new URL(node.getAttribute('src'), url)

              if (u.protocol === 'file:' && u.host === '') {
                this.import(decodeURIComponent(u.pathname))
                node.parentNode.removeChild(node)
                continue
              }
            }
          }
        } else if (node instanceof HTMLLinkElement && node.rel === 'import') {
          if (node.href !== null) {
            let u = new URL(node.getAttribute('src'), url)

            if (u.protocol === 'file:' && u.host === '') {
              this.import(decodeURIComponent(u.pathname))
              node.parentNode.removeChild(node)
              continue
            }
          }
        } else if (node instanceof HTMLTemplateElement) {
          await this.processNode(node.content, url)
        }

        if (node.tagName.indexOf('-') === -1) {
          for (let name of ['src', 'href', 'image']) {
            if (node[name] == null || node.tagName === 'BASE') continue

            let value = node.getAttribute(name)
            if (value === null) continue

            let pathname = await resolve(value)
            if (pathname != null) value = getURL(pathname)

            let type = node.type ? node.type : node.tagName === 'SCRIPT' ?
              'js' : node.rel === 'stylesheet' ?
                'css' : node.rel === 'import' ?
                  'html' : node.tagName === 'IMG' ? 'image' : undefined

            let uri = await this.processURI(value, url, type)

            node.setAttribute(name, uri)
          }
        }
      } else if (node instanceof window.Text) {
        node.data = node.data.replace(/\s*?\n\s*/g, '\n').replace(/[^\S\n]+/g, ' ')
      }
    }
  }

  async processDocument(document, url) {
    await this.processNode(document, url)
  }

  async processHTMLText(text, url) {
    let p = new DOMParser()
    let document = p.parseFromString(text, 'text/html')
    await this.processDocument(document, url)

    if (!await this.include(url)) {
      let base = document.createElement('BASE')
      base.href = url

      document.head.insertBefore(base, document.head.firstChild)
    }

    let s = new XMLSerializer()
    return s.serializeToString(document)
  }

  async processScriptText(text, id) {
    for (let plugin of this.transformer.plugins) {
      if (plugin.transform) {
        let result = await plugin.transform(text, id)
        if (result != null) text = typeof result === 'string' ? result : result.code
      }
    }

    return text
  }

  async processModuleText(text, id) {
    let ast = acorn.parse(text, {sourceType: 'module'})

    text = this.processScriptText(text, id)

    ast.body = ast.body.map(node => {
      if (node.startsWith('Export')) return node.declaration
    })

    ast.body = ast.body.filter(node => {
      if (!node.startsWith('Import')) return true

      this.import(node.source.value)
    })

    return escodegen.generate(ast)
  }

  async processCSSText(s, url) {
    cssRE.lastIndex = 0

    let segments = []
    let match

    while (true) {
      let index = 
      match = cssRE.exec(s)
      if (match === null) break

      let url = match[3] === undefined ? match[5] : match[3]
      if (url !== undefined) {
        segments.push()
      }
    }

    this.body = body
  }

  async processStyleElement(element) {
    let parent = element.parentNode
    if (parent === null) throw new TypeError('Element has no parent')

    element.innerHTML = this.processCSSText(element.innerHTML)
  }

  async processURI(u, parent, type) {
    parent = new URL(parent)
    u = new URL(u, parent)
    if (u.protocol !== 'file:') return u.href

    if (parent.protocol !== 'file:' || parent.host !== '' || u.host !== '') {
      throw new TypeError('Not a local file URL')
    }

    if (!await this.include(u)) {
      return relative(dirname(parent.pathname), u.pathname) + u.search + u.hash
    }

    let pathname = decodeURIComponent(u.pathname)
    pathname = await new Promise((resolve, reject) => realpath(pathname, (error, pathname) => error ? reject(error) : resolve(pathname)))
    type = getType(type, pathname)

    let ext = pathname.substr(pathname.lastIndexOf('.') + 1)

    if (pathnames.has(pathname)) throw new ReferenceError(`Circular depencency to ${pathname}`)

    pathnames.add(pathname)

    try {
      if (ext !== 'js') this.import(pathname) // TODO: Replace by dependency when implemented in rollup

      let data

      if (ext === 'css') {
        data = await this.processCSSText(await getData(pathname, 'utf-8'), u.href)
      } else if (ext === 'html') {
        data = await this.processHTMLText(await getData(pathname, 'utf-8'), u.href)
      } else if (ext === 'js') {
        data = await this.processScriptText(await getData(pathname, 'utf-8'), pathname)
      } else if (ext === 'module') {
        data = await this.processModuleText(await getData(pathname, 'utf-8'), pathname)
      } else {
        data = await getData(pathname)
      }

      data = this.transformer.format(data, ext, type)

      let du = new DataURI()
      du.format('.' + type, data)
      return du.content + u.search + u.hash
    } finally {
      pathnames.delete(pathname)
    }
  }
}
