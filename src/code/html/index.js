export default (html, imports) => `
${imports.map(id => `import ${JSON.stringify(id)}`).join('\n')}

export default new DOMParser().parseFromString(${JSON.stringify(html)}, 'text/html')
`
