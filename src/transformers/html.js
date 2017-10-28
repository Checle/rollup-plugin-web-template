import window from '../window.js'
import code from './code/html/index.js'
import codeInput from './code/html/input.js'
import {processDocument} from '../processors/html.js'
import {getURL} from '../utils.js'

export default class HTMLTransformer {
  type
  imports
  inputID
  inputDocument = null

  constructor (inputID, type = 'html', imports = [], link = false) {
    this.inputID = inputID
    this.type = type
    this.imports = imports
    this.link = link
  }

  async transform(html, id) {
    let imports = []
    let url = getURL(id)
    let document = new window.DOMParser().parseFromString(html, 'text/html')
    await processDocument(document, url.href, childID => id !== childID && imports.push(childID), this.link)

    if (id === this.inputID) {
      this.inputDocument = document

      imports = this.imports.concat(imports)

      if (this.type === 'js') {
        return codeInputJS(html, imports)
      } else if (this.type === 'html') {
        return codeInput(html, imports)
      }
    }

    html = new window.XMLSerializer().serializeToString(document)
    return code(html, imports)
  }

  transformBundle(code, format) {
    let document = this.inputDocument

    if (this.type === 'html') {
      if (document === null) document = new window.DOMParser().parseFromString('', 'text/html')

      if (format === 'iife' || format === 'module') {
        let script = document.createElement('SCRIPT')

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
