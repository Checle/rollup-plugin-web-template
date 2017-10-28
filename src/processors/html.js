import {window} from '../index.js'
import {processURI} from './uri.js'
import {getType} from '../utils.js'

var babel = require('babel-core')
var {URL} = require('whatwg-url')

async function processNode(root, url, imp) {
  let node = root

  while (true) {
    if (node instanceof window.Element) {
      if (node instanceof window.HTMLScriptElement) {
        if (node.src === null) {
          // TODO: rollup single file
        } else {
          // TODO: transpile single script

          if (node.type === 'module') {
            let u = new URL(node.src, url)

            if (u.protocol === 'file:' && u.host === '') {
              imp(decodeURIComponent(u.pathname))
              node.parentNode.removeChild(node)
            }
          }
        }
      } else if (node instanceof window.HTMLLinkElement && node.rel === 'import') {
        if (node.href !== null) {
          let u = new URL(href, url)

          if (u.protocol === 'file:' && u.host === '') {
            imp(decodeURIComponent(u.pathname))
            node.parentNode.removeChild(node)
          }
        }
      } else if (node.tagName.indexOf('-') === -1) {
        for (let name of ['src', 'href', 'image']) {
          if (!node.hasOwnProperty(name) || node[name] == null) continue

          let value = node.getAttribute(name)
          if (value === null) continue

          url = await processURI(value, url, imp, node.type)

          node.setAttribute(name, uri)
        }
      }
    }

    if (node.firstChild !== null) node = node.firstChild
    else {
      while (node.nextSibling === null) {
        if (node === root) return

        node = node.parentNode
      }

      node = node.nextSibling
    }
  }
}

export async function processDocument(document, url, imp) {  
  let base = document.createElement('base')
  base.href = url

  document.head.appendChild(base)

  await processNode(document, imp)
}

export default async function processHTMLText(text, url, imp) {
  let {DOMParser, XMLSerializer} = window

  let p = new DOMParser()
  let document = p.parseFromString(text, 'text/html')
  await processDocument(document, url, imp)

  let s = new XMLSerializer()
  return s.serializeToString(document)
}
