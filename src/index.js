import Transformer from './transformer.js'
import {getType} from './utils.js'

var {realpathSync} = require('fs')

let currentTransformer

let i = 0

export default function Plugin(options = {}) {
  let {type, link, imports, includes, excludes} = options
  let transformer = new Transformer(imports, link, includes, excludes)
  let id
  let j = i++

	return {
		name: 'web-template',

    options(options) {
      if (currentTransformer === transformer) return

      id = realpathSync(options.input)

      transformer.config(id, options.plugins)
    },

    async transform(code, id) {
      if (currentTransformer === transformer) return

      let lastTransformer = currentTransformer
      currentTransformer = transformer

      try {
        return await transformer.transform(code, id)
      } finally {
        currentTransformer = lastTransformer
      }
    },

    transformBundle(code, options) {
      if (currentTransformer === transformer) return

      let {format} = options

      return transformer.transformBundle(code, currentTransformer ? 'js' : getType(type, id), format)
    },
  }
}
