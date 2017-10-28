var {JSDOM} = require('jsdom')

let {window} = new JSDOM()

window.XMLSerializer = class XMLSerializer {
  serializeToString(root) {
    // TODO: include doctype
    if (root.nodeType === root.DOCUMENT_NODE) root = root.documentElement

    return root.outerHTML
  }
}

export default window
