import type { DetectedItem, ScanResult } from '../types'

/**
 * DataSource interface — swap implementations to change where data comes from.
 *
 * Current implementations:
 *   - ClaudeDataSource: calls the Claude Vision API (via Vite proxy)
 *
 * Future:
 *   - BackendDataSource: calls your own API that stores scans, uses its own keys, etc.
 */
export interface DataSource {
  /**
   * Analyse an image and return detected home contents with values.
   * @param imageBase64 - base64-encoded image (no data: prefix)
   * @param mimeType - e.g. 'image/jpeg'
   */
  analyseImage(imageBase64: string, mimeType: string, imageUrl?: string): Promise<ScanResult>

  /**
   * Optionally enrich / override values for a list of items.
   * Useful when a backend has its own pricing database.
   * Default implementation just returns the items unchanged.
   */
  enrichValues?(items: DetectedItem[]): Promise<DetectedItem[]>
}
