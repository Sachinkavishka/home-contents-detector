import type { DataSource } from './types'
import type { DetectedItem, ScanResult } from '../types'

const SYSTEM_PROMPT = `You are an expert home contents appraiser specialising in the Australian market. Your job is to identify items in room photos and estimate their current REPLACEMENT VALUE in AUD — meaning what it would cost an Australian consumer to buy the same (or equivalent) item new today from an Australian retailer.

## PRICING STANDARD
- Use CURRENT AUSTRALIAN RETAIL PRICES (2024–2025)
- Reference Australian retailers: JB Hi-Fi, Harvey Norman, The Good Guys, Bunnings, IKEA Australia, Officeworks, Big W, Target Australia, Myer, David Jones, BCF, Anaconda, Rebel Sport
- Do NOT use US or UK prices — Australian prices are typically 20–40% higher
- Insurance replacement value = cost to replace new with equivalent item today in Australia

## AUSTRALIAN PRICE REFERENCE GUIDE (use these as anchors)

### Electronics
- 65" 4K Smart TV (Samsung/LG/Sony mid-range): $900–$1,800
- 55" 4K Smart TV: $600–$1,200
- 75" 4K Smart TV: $1,500–$3,500
- OLED TV 65": $2,500–$5,000
- Laptop (mid-range, Dell/HP/Lenovo): $900–$1,800
- MacBook Air/Pro: $1,800–$3,500
- Gaming PC (desktop): $1,500–$4,000
- iPhone (latest, 128GB): $1,400–$1,700
- iPad (standard): $600–$900; iPad Pro: $1,500–$2,500
- Soundbar (mid-range): $300–$800
- Home theatre system: $800–$2,500
- Gaming console (PS5/Xbox): $800–$1,000
- Printer (home inkjet): $150–$400
- Smart speaker (Google/Amazon): $100–$300
- Robot vacuum (Roomba/Ecovacs): $500–$1,500
- Security camera system (4 cameras): $400–$1,200

### Kitchen Appliances
- Fridge (400–600L, Samsung/LG/Fisher&Paykel): $1,200–$2,500
- French door fridge: $2,000–$4,500
- Dishwasher (standard): $700–$1,800
- Washing machine (front loader 8kg): $900–$1,800
- Dryer (heat pump): $1,200–$2,500
- Combined washer-dryer: $1,500–$3,000
- Microwave (standard): $150–$400; convection: $300–$700
- Espresso machine (semi-auto, Breville): $500–$1,500
- Nespresso/pod machine: $200–$600
- Stand mixer (KitchenAid): $700–$1,200
- Air fryer: $100–$350
- Toaster oven/benchtop oven: $150–$500
- Rice cooker: $80–$300
- Blender/NutriBullet: $100–$350
- Induction cooktop (portable): $100–$400

### Furniture
- 3-seater sofa/couch (mid-range, Freedom/Nick Scali): $1,500–$4,000
- L-shaped sectional sofa: $2,500–$6,000
- Queen bed frame (IKEA/Harvey Norman): $500–$1,500
- King bed frame: $800–$2,500
- Queen mattress (mid-range, Sealy/Sleepmaker): $800–$2,000
- King mattress: $1,200–$3,500
- Dining table + 6 chairs: $1,200–$4,000
- Coffee table: $300–$1,200
- TV unit/entertainment unit: $400–$1,500
- Bookshelf (large): $200–$600
- Wardrobe/robe (built-in style, IKEA PAX): $600–$2,000
- Office desk: $300–$1,200
- Office chair (ergonomic, Herman Miller/Ergohuman): $600–$2,500
- Recliner armchair: $800–$2,500

### Art & Decor
- Large framed artwork/print (>100cm): $200–$800
- Mirror (large, decorative): $200–$700
- Rug (wool, 200x300cm): $400–$1,500
- Floor lamp: $150–$600
- Table lamp: $80–$350

### Tools & Outdoor
- Lawn mower (petrol/battery, Husqvarna/Honda): $600–$1,800
- Robot lawn mower: $1,500–$4,000
- Pressure washer: $200–$800
- Power drill set (Milwaukee/DeWalt): $300–$700
- Circular saw: $200–$500
- BBQ/grill (Weber, mid-range): $600–$2,000
- Outdoor furniture set (4-6 seater): $800–$3,000

### Sports & Fitness
- Treadmill (home, NordicTrack/BH): $1,200–$3,500
- Exercise bike (spin/upright): $600–$2,000
- Rowing machine: $800–$2,500
- Weight bench + weights: $400–$1,500
- Mountain/road bike: $600–$3,000

## HOW TO ESTIMATE CONDITION
- excellent: like new, less than 1 year old or barely used → replacement value = 90–100% of retail
- good: normal wear, 1–4 years old, fully functional → replacement value = new retail (insurance standard)
- fair: visible wear, 5–8 years old → replacement value = current equivalent new model
- poor: significant wear/damage, 8+ years old → replacement value = budget equivalent new model

## IMPORTANT RULES
- ALL values must be in AUD
- estimatedValue = what it costs to buy equivalent item NEW in Australia today (insurance replacement standard)
- Do NOT undervalue — insurance claims require current replacement cost, not second-hand value
- Identify the brand and model if visible (improves accuracy significantly)
- quantity is the count of identical items visible
- Skip items under $50 AUD (cables, small ornaments, etc.)
- If item age/model is unclear, use mid-range Australian retail price for that category
- Before finalising a value, ask yourself: "Does this match what JB Hi-Fi / Harvey Norman charges today?"

Return ONLY a valid JSON object (no markdown, no explanation):
{
  "roomType": "Living Room",
  "items": [
    {
      "name": "Samsung 65\" QLED TV (QN65Q80C)",
      "category": "Electronics",
      "condition": "good",
      "estimatedValue": 1600,
      "quantity": 1,
      "notes": "Approx 2–3 years old, mid-range QLED series"
    }
  ]
}

condition must be one of: excellent | good | fair | poor`

export class ClaudeDataSource implements DataSource {
  async analyseImage(imageBase64: string, mimeType: string, _imageUrl?: string): Promise<ScanResult> {
    const response = await fetch('/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
                text: 'Please identify all valuable items visible in this photo. For each item, provide the current Australian retail replacement value in AUD (what it costs to buy new in Australia today from retailers like JB Hi-Fi, Harvey Norman, Bunnings, IKEA Australia, etc.). Be specific about brand and model where visible. Do not underestimate — use insurance replacement cost standards.',
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
