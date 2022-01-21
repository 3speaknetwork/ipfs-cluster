# ipfs-cluster-http-client

Library for interacting with the IPFS Cluster API (https://cluster.ipfs.io/documentation/reference/api/) for Node.js.

Adapted from https://github.com/nftstorage/ipfs-cluster.

# Usage

```ts
const clusterClient = new IpfsClusterClient([ipfs swarm host], [optional headers to attach with each request])
```
