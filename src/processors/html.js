import window from '../window.js'
import {processURI} from './uri.js'
import {getType} from '../utils.js'

var babel = require('babel-core')
var {URL} = require('whatwg-url')

let {DOMParser, XMLSerializer, Text, Element, HTMLScriptElement, HTMLLinkElement} = window

async function processNode(root, url, imp, link) {
  let node = root

  function getNext(node) {
    if (node.firstChild !== null) return node.firstChild

    while (node.nextSibling === null) {
      if (node === root) return null

      node = node.parentNode
      if (node === null) return null
    }

    return node.nextSibling
  }

  for (let next; node !== null; node = next) {
    next = getNext(node)

    if (node instanceof Element) {
      if (node instanceof HTMLScriptElement) {
        if (node.src === null) {
          // TODO: rollup single file
        } else {
          // TODO: transpile single script

          if (node.type === 'module') {
            let u = new URL(node.src, url)

            if (u.protocol === 'file:' && u.host === '') {
              imp(decodeURIComponent(u.pathname))
              node.parentNode.removeChild(node)
              continue
            }
          }
        }
      } else if (node instanceof HTMLLinkElement && node.rel === 'import') {
        if (node.href !== null) {
          let u = new URL(href, url)

          if (u.protocol === 'file:' && u.host === '') {
            imp(decodeURIComponent(u.pathname))
            node.parentNode.removeChild(node)
            continue
          }
        }
      }

      if (node.tagName.indexOf('-') === -1) {
        for (let name of ['src', 'href', 'image']) {
          if (node[name] == null || node.tagName === 'BASE') continue

          let value = node.getAttribute(name)
          if (value === null) continue

          let uri = await processURI(value, url, imp, node.type, link)

          node.setAttribute(name, uri)
        }
      }
    } else if (node instanceof window.Text) {
      if (node.data.length !== 0 && node.data.trim() === '') {
        if (node.previousSibling instanceof Text && node.previousSibling.data.trim() === '') {
          node.data = ''
        } else {
          node.data = '\n'
        }
      }
    }
  }
}

export async function processDocument(document, url, imp, link) {
  if (link) {
    let base = document.createElement('BASE')
    base.href = url

    document.head.appendChild(base)
  }

  await processNode(document, url, imp, link)
}

export default async function processHTMLText(text, url, imp) {
  let p = new DOMParser()
  let document = p.parseFromString(text, 'text/html')
  await processDocument(document, window, url, imp)

  let s = new XMLSerializer()
  return s.serializeToString(document)
}
