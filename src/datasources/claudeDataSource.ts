import type { DataSource } from './types'
import type { DetectedItem, ScanResult } from '../types'

const SYSTEM_PROMPT = `You are an expert home contents appraiser with deep knowledge of second-hand, retail, and insurance replacement values.

When given a photo of a room or area, you will:
1. Identify every visible item that has meaningful value (furniture, electronics, appliances, art, jewellery, collectibles, etc.)
2. Estimate the current replacement value in AUD (Australian Dollars) for each item
3. Assess the condition of each item
4. Categorise each item

Return ONLY a valid JSON object (no markdown, no explanation) in this exact shape:
{
  "roomType": "Living Room",
  "items": [
    {
      "name": "Samsung 65\" QLED TV",
      "category": "Electronics",
      "condition": "good",
      "estimatedValue": 1800,
      "quantity": 1,
      "notes": "Appears to be 2-3 years old"
    }
  ]
}

Rules:
- condition must be one of: excellent | good | fair | poor
- estimatedValue is a number (no currency symbols)
- quantity is a positive integer
- Be conservative — use second-hand / used replacement values, not brand new retail
- Skip items with value under $20 (cables, small ornaments, etc.)
- If you cannot identify an item clearly, make a reasonable estimate and note it`

export class ClaudeDataSource implements DataSource {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async analyseImage(imageBase64: string, mimeType: string, _imageUrl?: string): Promise<ScanResult> {
    const response = await fetch('/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mimeType,
                  data: imageBase64,
                },
              },
              {
                type: 'text',
                text: 'Please identify all valuable items in this photo and estimate their replacement values.',
              },
            ],
          },
        ],
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      const msg = (err as { error?: { message?: string } }).error?.message ?? `HTTP ${response.status}`
      throw new Error(`Claude API error: ${msg}`)
    }

    const data = await response.json() as {
      content: Array<{ type: string; text: string }>
    }

    const raw = data.content.find((b) => b.type === 'text')?.text ?? ''
    // Strip markdown code fences if Claude wraps the JSON in ```json ... ```
    const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    const parsed = JSON.parse(text) as {
      roomType: string
      items: Array<{
        name: string
        category: string
        condition: DetectedItem['condition']
        estimatedValue: number
        quantity: number
        notes?: string
      }>
    }

    const items: DetectedItem[] = parsed.items.map((item, i) => ({
      id: `item-${Date.now()}-${i}`,
      name: item.name,
      category: item.category,
      condition: item.condition,
      estimatedValue: item.estimatedValue,
      quantity: item.quantity,
      notes: item.notes,
    }))

    const totalValue = items.reduce(
      (sum, item) => sum + item.estimatedValue * item.quantity,
      0,
    )

    return {
      items,
      roomType: parsed.roomType ?? 'Unknown Room',
      scanDate: new Date().toISOString(),
      imageUrl: `data:${mimeType};base64,${imageBase64}`,
      totalValue,
    }
  }
}
