/* eslint-env browser */

import { URL } from 'url'
import { request } from './request.function'
import {
  AddDirectoryResponse,
  AddParams,
  AddResponse,
  FileWithName,
  PinInfo,
  PinOptions,
  PinResponse,
  RequestOptions,
  StatusOptions,
  StatusResponse,
} from './internal.types'
import { Utils } from './utils'
import FormData from 'form-data'
import axios, { AxiosError, AxiosRequestConfig } from 'axios'
import { config } from 'process'
import { AddResponseItem } from './api.types'

export class IpfsClusterClient {
  /**
   * @param {URL|string} url Cluster HTTP API root URL.
   * @param {{ headers?: Record<string, string> }} [options]
   */
  public readonly hostUrl: URL
  /**
   * base64 encoded
   */
  private readonly authorizationHeader: string = ''
  constructor(host: string, username?: string, password?: string) {
    this.hostUrl = new URL(host)

    if (username && password) {
      this.authorizationHeader = `Basic ${Buffer.from(`${username}:${password}`, 'utf8').toString(
        'base64',
      )}`
    }
  }

  /**
   * @param {API.RequestOptions} [options]
   */
  version(options?: RequestOptions) {
    return Utils.version(this, options)
  }

  /**
   * @param {API.RequestOptions} [options]
   * @returns {Promise<API.ClusterInfo>}
   */
  info(options?: RequestOptions) {
    return Utils.info(this, options)
  }

  public constructHeaders(headers: Record<string, string> = {}): Record<string, string> {
    if (this.authorizationHeader) {
      return { ...headers, Authorization: this.authorizationHeader }
    } else {
      return headers
    }
  }

  async addFromFormData(formData: FormData, options?: AddParams): Promise<AddResponse> {

    const params = Utils.encodeAddParams(options)

    try {
      //       const result = await request(
      //         this,
      //         'add',
      //         {
      //           params,
      //           method: 'POST',
      //           body: formData,
      //           signal: options?.signal,
      //         },
      //         this.constructHeaders(formData.getHeaders()),
      //       )

      const config: AxiosRequestConfig = {
        params,
        headers: this.constructHeaders(formData.getHeaders()),
        baseURL: this.hostUrl.href,
        signal: options?.signal,
      }

      const result = await axios.post<AddResponseItem[] | AddResponseItem>(`add`, formData, config)

      if (!Array.isArray(result.data)) {
        result.data = [result.data]
      }

      const item = result.data[0]
      return {
        name: item.name,
        cid: item.cid['/'],
        size: item.size,
      }
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        console.log(`response ${err.message}`)
        console.log(`status ${err.code}`)
        console.log(err.response?.data)
        console.log(err.response?.statusText)
      }
      throw err
    }
  }
  /**
   * For endpoint https://docs.ipfs.io/reference/http/api/#api-v0-add
   */
  async addFile(file: FileWithName, options?: AddParams): Promise<AddResponse> {
    const formData = new FormData()
    formData.append('file', file.contents, file.name)

    const params = Utils.encodeAddParams(options)

    try {
      //       const result = await request(
      //         this,
      //         'add',
      //         {
      //           params,
      //           method: 'POST',
      //           body: formData,
      //           signal: options?.signal,
      //         },
      //         this.constructHeaders(formData.getHeaders()),
      //       )

      const config: AxiosRequestConfig = {
        params,
        headers: this.constructHeaders(formData.getHeaders()),
        baseURL: this.hostUrl.href,
        signal: options?.signal,
      }

      const result = await axios.post<AddResponseItem[] | AddResponseItem>(`add`, formData, config)

      if (!Array.isArray(result.data)) {
        result.data = [result.data]
      }

      const item = result.data[0]
      return {
        name: item.name,
        cid: item.cid['/'],
        size: item.size,
      }
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        console.log(`response ${err.message}`)
        console.log(`status ${err.code}`)
        console.log(err.response?.data)
        console.log(err.response?.statusText)
      }
      throw err
    }
  }

  async addData(file: FileWithName, options: AddParams): Promise<AddResponse> {
    const body = new FormData()
    body.append('file', file)

    const params = Utils.encodeAddParams(options)

    const result = await request(this, 'add', {
      params,
      method: 'POST',
      body,
      signal: options.signal,
    })
    const data = params.get('stream-channels') ? result : result[0]
    return { ...data, cid: data.cid['/'] }
  }

  async addDirectory(
    files: FileWithName[],
    options?: RequestOptions,
  ): Promise<AddDirectoryResponse> {
    const body = new FormData()

    for (const f of files) {
      body.append('file', f.contents, f.name)
    }

    const results = await request(this, 'add', {
      params: {
        ...Utils.encodeAddParams(options),
        'stream-channels': false,
        'wrap-with-directory': true,
      },
      method: 'POST',
      body,
      signal: options?.signal,
    })

    for (const f of results) {
      f.cid = f.cid['/']
    }

    return results
  }

  /**
   * @param {API.AddParams} [options]
   * @returns {Promise<API.AddResponse>}
   */
  addCAR(car: FileWithName, options: AddParams): Promise<AddResponse> {
    return this.addFile(car, { ...options, format: 'car' })
  }

  async pin(cid: string, options: PinOptions): Promise<PinResponse> {
    const path = cid.startsWith('/') ? `pins${cid}` : `pins/${cid}`

    const data = await request(this, path, {
      params: Utils.getPinParams(options),
      method: 'POST',
      signal: options.signal,
    } as any)

    return Utils.toPinResponse(data)
  }

  async unpin(cid: string, options?: RequestOptions): Promise<PinResponse> {
    const path = cid.startsWith('/') ? `pins${cid}` : `pins/${cid}`
    const data = await request(this, path, {
      ...options,
      method: 'DELETE',
    } as any)

    return Utils.toPinResponse(data)
  }

  async pinls(options: RequestOptions): Promise<PinResponse> {
    const path = `allocations`
    const data = await request(this, path, options)

    return Utils.toPinResponse(data)
  }

  async status(cid: string, options?: StatusOptions): Promise<StatusResponse> {
    const path = `pins/${encodeURIComponent(cid)}`

    const data = await request(this, path, {
      params: { local: options?.local },
      signal: options?.signal,
    } as any)

    const peer_map = data.peer_map as any[]
    let peerMap: Record<string, PinInfo> = {}
    if (peer_map) {
      peerMap = Object.fromEntries(
        Object.entries(peer_map).map(([k, v]) => [
          k,
          {
            peerName: v.peername,
            status: v.status,
            timestamp: new Date(v.timestamp),
            error: v.error,
          },
        ]),
      )
    }

    return { cid: data.cid['/'], name: data.name, peerMap }
  }

  async allocation(cid: string, options?: RequestOptions): Promise<PinResponse> {
    const path = `allocations/${encodeURIComponent(cid)}`
    const data = await request(this, path, options)

    return Utils.toPinResponse(data)
  }

  async recover(cid: string, options?: RequestOptions): Promise<StatusResponse> {
    const path = `pins/${encodeURIComponent(cid)}/recover`

    const data = await request(this, path, {
      method: 'POST',
      params: { local: options?.local },
      signal: options?.signal,
    } as any)

    const peer_map = data.peer_map as any[]
    let peerMap: Record<string, PinInfo> = {}
    if (peer_map) {
      peerMap = Object.fromEntries(
        Object.entries(peer_map).map(([k, v]) => [
          k,
          {
            peerName: v.peername,
            status: v.status,
            timestamp: new Date(v.timestamp),
            error: v.error,
          },
        ]),
      )
    }

    return { cid: data.cid['/'], name: data.name, peerMap }
  }

  /**
   * @param {API.RequestOptions} [options]
   * @returns {Promise<string[]>}
   */
  metricNames(options?: RequestOptions) {
    return request(this, 'monitor/metrics', options)
  }
}
