var {URL} = require('whatwg-url')

let re = /(["'])(?:\\"|.)?\1|\/\*[\s\S]*?\*\/|(@import\s+|[:\s]url\(\s*)(?:(["']?)((?:\\[\s\S]|.)*)\3|([^);]))/g

function replaceURL(u) {
  u = new URL(u)

  if (u.protocol === 'file:') {
    await createDataURI(decodeURIComponent(u.pathname))
  }
}

export async function processCSSText(s) {
  re.lastIndex = 0

  let segments = []
  let match

  while (true) {
    match = re.exec(s)
    if (match === null) break

    let url = match[3] === undefined ? match[5] : match[3]
    if (url !== undefined) 
  }

  this.body = body
}

export async function processStyleElement(element) {
  let parent = element.parentNode
  if (parent === null) throw new TypeError('Element has no parent')

  element.innerHTML = processCSSText(element.innerHTML)
}
