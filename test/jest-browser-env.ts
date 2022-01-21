// To compensate for missing TextEncoder in jsdom per https://github.com/jsdom/jsdom/issues/2524

const Environment = require('jest-environment-jsdom')

class CustomJsDomEnvironment extends Environment {
  async setup() {
    await super.setup()
    if (typeof this.global.TextEncoder === 'undefined') {
      const { TextEncoder, TextDecoder } = require('util')
      this.global.TextEncoder = TextEncoder
      this.global.TextDecoder = TextDecoder
    }
  }
}

export default CustomJsDomEnvironment
