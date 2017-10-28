export default (html, imports) => `

${imports.map(id => `import ${JSON.stringify(id)}`).join('\n')}

var document = new DOMParser().parseFromString(${JSON.stringify(html)}, 'text/html')
document.head.appendChild(template.content)
export default document

`
