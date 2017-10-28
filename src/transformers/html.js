import code from './code/html/index.js'
import codeInput from './code/html/input.js'
import {window} from '../index.js'

export default class HTMLTransformer {
  type
  inputID
  inputDocument = null

  constructor (inputID, type = 'html') {
    this.inputID = inputID
    this.type = type
  }

  async transform(html, id) {
    let imports = []
    let url = getURL(id)
    let document = new window.DOMParser().parseFromString(html, 'text/html')
    await processDocument(document, url.href, id => imports.push(id))

    if (id === this.inputID) {
      this.inputDocument = document

      imports.unshift(__dirname + '/web-template.js') // TODO: check if referenced

      if (this.type === 'js') {
        return codeInputJS(html, imports)
      } else if (this.type === 'html') {
        return codeInput(html, imports)
      }
    }

    html = new window.XMLSerializer.serializeToString(document)
    return code(html, imports)
  }

  transformBundle(code, format) {
    let document = this.inputDocument

    if (this.type === 'html') {
      if (document === null) document = new window.DOMParser().parseFromString('', 'text/html')

      if (format === 'iife' || format === 'module') {
        let script = document.createElement('script')

        if (format === 'module') script.setAttribute('type', 'module')
        else script.setAttribute('defer', '')

        script.appendChild(document.createTextNode(code))
        document.head.insertBefore(script, document.head.firstChild)
      }

      return new window.XMLSerializer().serializeToString(document)
    } else if (this.type === 'js' && document !== null) {
      let html = new window.XMLSerializer().serializeToString(document)
      return generateJSEntryCode(html)
    }
  }
}
