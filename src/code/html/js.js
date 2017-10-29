export default (html, imports) => `
var document
if (typeof document === 'undefined') document = new DOMParser().parseFromString('', 'text/html')
document.open('text/html')
document.write(${JSON.stringify(html)})
document.close()
`
