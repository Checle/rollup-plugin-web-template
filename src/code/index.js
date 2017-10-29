export default imports => `
${imports.map(id => `import ${JSON.stringify(id)}`).join('\n')}
`
