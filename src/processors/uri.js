var DataURI = require('datauri')
var {URL} = require('whatwg-url')
var {readFile, realpath} = require('fs')
var {dirname, relative} = require('path').posix

let pathnames = new Set()
let types = {javascript: 'js', ecmascript: 'js'}

export async function processURI(u, parent, imp, mimeType = null, link = false) {
  parent = new URL(parent)
  u = new URL(u, parent)
  if (u.protocol !== 'file:') return u.href

  if (link) {
    if (parent.protocol !== 'file:' || u.host !== parent.host) return u.href

    return relative(dirname(parent.pathname), u.pathname) + u.search + u.hash
  }

  let pathname = decodeURIComponent(u.pathname)
  pathname = await new Promise((resolve, reject) => realpath(pathname, (error, pathname) => error ? reject(error) : resolve(pathname)))

  imp(pathname)

  if (set.has(pathname)) throw new ReferenceError(`Circular depencency to ${pathname}`)
  set.add(pathname)

  let type = getType(pathname, mimeType)
  let data

  if (type === 'css') {
    data = await processCSSText(await getData(pathname, 'utf-8'))
  } else if (type === 'html') {
    data = await processHTMLText(await getData(pathname, 'utf-8'))
  } else if (type === '')
  } else {
    data = await getData(pathname)
  }

  let du = new DataURI()
  du.format(pathname, data)
  return du.content + u.search + u.hash
}
