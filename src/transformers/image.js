import code from './code/image.js'

var createDataURI = require('datauri').promise

export default class ImageTransformer {
  async transform(code, id) {
    let uri = await createDataURI(id) // TODO: avoid double loading
    return code(uri)
  }
}
