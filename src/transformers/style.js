import code from './code/style.js'

var createDataURI = require('datauri').promise

export default class StyleTransformer {
  async transform(code, id) {
    let uri = await createDataURI(id) // TODO: avoid double loading
    return code(uri)
  }
}
