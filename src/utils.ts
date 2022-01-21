import { URLSearchParams } from 'url'
import { IpfsClusterClient } from './ipfs-cluster.client'
import { request } from './request.function'
import { AddParams, PinOptions, PinResponse, RequestOptions } from './internal.types'

export class Utils {
  /**
   * Gets cluster version
   *
   * @param {API.Config} cluster
   * @param {API.RequestOptions} [options]
   * @returns {Promise<string>}
   */
  static async version(
    cluster: IpfsClusterClient,
    headers: Record<string, string>,
    options?: RequestOptions,
  ) {
    const result = await request(cluster.clusterHost.href, 'version', headers, options)

    if (typeof result.version !== 'string') {
      throw new Error(
        `failed to parse version from response the body: ${JSON.stringify(result, null, 2)}`,
      )
    }

    return result.version
  }

  /**
   * Gets cluster information
   *
   * @param {API.Config} cluster
   * @param {API.RequestOptions} [options]
   * @returns {Promise<API.ClusterInfo>}
   */
  static async info(
    cluster: IpfsClusterClient,
    headers: Record<string, string>,
    options?: RequestOptions,
  ) {
    const result = await request(cluster.clusterHost.href, 'id', headers, options)

    const failure = result.error || result.ipfs?.error || ''
    if (failure.length > 0) {
      throw new Error(`cluster id response has failure: ${JSON.stringify(result, null, 2)}`)
    }

    const {
      id,
      addresses,
      version,
      commit,
      peername: peerName,
      rpc_protocol_version: rpcProtocolVersion,
      cluster_peers: clusterPeers,
      cluster_peers_addresses: clusterPeersAddresses,
      ipfs,
    } = result

    return {
      id,
      addresses,
      version,
      commit,
      peerName,
      rpcProtocolVersion,
      clusterPeers,
      clusterPeersAddresses,
      ipfs,
    }
  }

  static encodeAddParams(options: AddParams = {}): URLSearchParams {
    if (!options) return new URLSearchParams()

    const kvPairs = this.filterUndefinedProperties({
      ...this.getPinParams(options),
      local: options.local?.toString(),
      recursive: options?.recursive?.toString(),
      hidden: options.hidden?.toString(),
      wrap: options.wrap?.toString(),
      shard: options.shard?.toString(),
      // stream-channels=false means buffer entire response in cluster before returning.
      // MAY avoid weird edge-cases with prematurely closed streams
      // see: https://github.com/web3-storage/web3.storage/issues/323
      'stream-channels': options.streamChannels?.toString() ?? 'false',
      format: options.format,
      layout: options.layout,
      chunker: options.chunker,
      'raw-leaves': options.rawLeaves?.toString() ?? 'true',
      progress: options.progress?.toString(),
      'cid-version': options.cidVersion?.toString() ?? '1',
      hash: options.hashFun,
      'no-copy': options.noCopy?.toString(),
    })

    return new URLSearchParams(kvPairs)
  }

  static getPinParams(options: PinOptions) {
    return {
      name: options.name,
      mode: options.mode,
      'replication-min': options.replicationFactorMin?.toString(),
      'replication-max': options.replicationFactorMax?.toString(),
      'shard-size': options.shardSize?.toString(),
      'user-allocations': options.userAllocations?.join(','),
      'expire-at': options.expireAt?.toISOString(),
      'pin-update': options.pinUpdate,
      origins: options.origins?.join(','),
      ...this.encodeMetadata(options.metadata || {}),
    }
  }

  static filterUndefinedProperties(
    obj: Record<string, string | undefined>,
  ): Record<string, string> {
    return Object.fromEntries(Object.entries(obj).filter(([, v]) => v != null)) as Record<
      string,
      string
    >
  }

  static encodeMetadata(metadata: Record<string, string>) {
    return Object.fromEntries(Object.entries(metadata).map(([k, v]) => [`meta-${k}`, v]))
  }

  static toPinResponse = (data: any): PinResponse => {
    return {
      replicationFactorMin: data.replication_factor_min,
      replicationFactorMax: data.replication_factor_max,
      name: data.name,
      mode: data.mode,
      shardSize: data.shard_size,
      userAllocations: data.user_allocations,
      expireAt: new Date(data.expire_at),
      metadata: data.metadata,
      pinUpdate: data.pin_update,
      cid: data.cid['/'],
      type: data.type,
      allocations: data.allocations,
      maxDepth: data.max_depth,
      reference: data.reference,
    }
  }
}
