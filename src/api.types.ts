export interface AddResponseItem {
  name: string
  /**
   * Example value:
   *    cid: {
          '/': 'bafkreibme22gw2h7y2h7tg2fhqotaqjucnbc24deqo72b6mkl2egezxhvy'
        },
   */
  cid: Record<string, string>
  size: number
}
