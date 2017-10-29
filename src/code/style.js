import {escapeCode} from '../utils.js'

export default text => `
function Style() {
  let style = document.createElement('STYLE')
  style.innerHTML = ${JSON.stringify(escapeCode(text))}
  return style
}

Style.prototype = HTMLStyleElement.prototype

export default Style
`
