export default uri => `
export default class extends Image {
  constructor (...args) {
    super(...args)

    this.src = ${JSON.stringify(uri)}
  }
}
`
