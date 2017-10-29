# rollup-plugin-web-template

Compile standard Web apps

## Installation

```bash
npm install --save-dev rollup-plugin-web-template
```


## Usage

```js
// rollup.config.js
import wt from 'rollup-plugin-web-template'

export default {
  input: 'src/index.html', // .html or .js

  plugins: [
    wt({
      type: 'html', // Output type; one of 'html', 'js', 'module'
      link: false, // Bundle all files
      includes: [], // Bundle files in these paths
      excludes: [], // Link files in these paths as URL
      imports: [], // Modules to import
    }),
  ],
}
```


## License

MIT
