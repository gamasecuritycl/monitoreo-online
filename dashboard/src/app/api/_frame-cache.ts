const blobUrlCache = new Map<string, string>()

export function getCachedBlobUrl(sn: string, canal: number): string | undefined {
  return blobUrlCache.get(`${sn.toUpperCase()}_CH_${canal}`)
}

export function setCachedBlobUrl(sn: string, canal: number, url: string): void {
  const key = `${sn.toUpperCase()}_CH_${canal}`
  blobUrlCache.set(key, url)
  if (blobUrlCache.size > 50) {
    const firstKey = blobUrlCache.keys().next().value
    if (firstKey) blobUrlCache.delete(firstKey)
  }
}
