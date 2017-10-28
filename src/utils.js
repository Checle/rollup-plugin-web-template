var {isAbsolute, resolve} = require('fs')
var {URL} = require('whatwg-url')

export async function getData(pathname, encoding = null) {
  return await new Promise((resolve, reject) => {
    readFile(pathname, {encoding}, (error, data) => error ? reject(error) : resolve(data))
  })
}

export function getType(mimeType, defaultPathname) {
  if (mimeType != null) {
    mimeType = mimeType.replace(/;[\s\S]*/g, '').trim()

    let type = mimeType.substr(mimeType.indexOf('/') + 1).toLowerCase()
    return types.hasOwnProperty(type) ? types[type] : type
  }

  if (defaultPathname != null) {
    return defaultPathname.substr(defaultPathname.lastIndexOf('.') + 1)
  }
}

export function getURL(id, parentID) {
  if (!isAbsolute(id)) id = resolve(parentID, id)

  return new URL(encodeURIComponent(id).replace(/%2F/g, '/'), 'file:///')
}

export function escapeText(text) {
  return text.replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function first(a, ...args) {
  let result

  a.some(e => e && (result = e(...args)) != null)

  return result
}
