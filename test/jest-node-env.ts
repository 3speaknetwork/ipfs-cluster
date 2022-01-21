const Environment = require('jest-environment-node')

class CustomNodeEnvironment extends Environment {
  async setup() {
    await super.setup()
  }
}

export default CustomNodeEnvironment
