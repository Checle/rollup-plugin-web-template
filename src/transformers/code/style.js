import {escapeText} from '../../utils.js'

export default text => `

function Style() {
  let style = document.createElement('style')
  style.innerHTML = ${JSON.stringify(escapeText(text))}
  return style
}

Style.prototype = HTMLStyleElement.prototype

export default Style

`
