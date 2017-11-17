var {JSDOM} = require('jsdom')

let {window} = new JSDOM()

window.XMLSerializer = class XMLSerializer {
  serializeToString(root) {
    // TODO: include doctype

    if (root.nodeType === root.DOCUMENT_TYPE_NODE) {
      return `<!DOCTYPE ${root.name}>`
    }

    if (root.nodeType === root.TEXT_NODE) {
      return root.data
    }

    if (root.nodeType !== root.ELEMENT_NODE) {
      return [...root.childNodes].map(child => this.serializeToString(child)).join('')
    }

    return root.outerHTML
  }
}

export default window
