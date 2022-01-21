import { Readable } from 'stream'
import { TextEncoder } from 'util'
import { FileWithName } from '../src/internal.types'

export class TestUtils {
  private static stringToStream(text: string): Readable {
    const encoder = new TextEncoder()
    const view = encoder.encode(text)
    const buffer = Buffer.from(view)
    const stream = new Readable()
    stream.push(buffer)
    stream.push(null)
    return stream
  }

  static getFileFromText(fileName: string, text: string): FileWithName {
    return {
      name: fileName,
      contents: this.stringToStream(text),
    }
  }
}
