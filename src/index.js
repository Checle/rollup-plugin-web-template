var {realpathSync} = require('fs')

import HTMLTransformer from './transformers/html.js'
import ImageTransformer from './transformers/image.js'
import StyleTransformer from './transformers/style.js'
import {getType} from './utils.js'

var {JSDOM} = require('jsdom')
var {URL} = require('whatwg-url')

let dom = new JSDOM()

export var {window} = dom

window.XMLSerializer = class XMLSerializer {
  serializeToString(root) {
    return dom.serialize(root)
  }
}

export default function plugin(options = {}) {
  let {type, link, share} = options
  let it = new ImageTransformer()
  let st = new StyleTransformer()
  let inputID, ht

	return {
		name: 'web-template',

    options(options) {
      inputID = realpathSync(options.input)
      type = getType(type, inputID)
      ht = new HTMLTransformer(inputID, type)
    },

    transform(code, id) {
      let ext = id.substr(id.lastIndexOf('.') + 1)

      switch (ext) {
        case 'html':
        return ht.transform(code, id)

        case 'gif':
        case 'jpeg':
        case 'jpg':
        case 'png':
        case 'svg':
        return it.transform(code, id)

        case 'css':
        return st.transform(code, id)
      }
    },

    transformBundle(code, format) {
      return ht.transformBundle(code, format)
    },
  }
}
