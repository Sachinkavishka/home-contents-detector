import type { DataSource } from './types'
import type { ScanResult } from '../types'

const DEMO_RESULTS: ScanResult[] = [
  {
    roomType: 'Living Room',
    scanDate: new Date().toISOString(),
    imageUrl: '',
    totalValue: 0,
    items: [
      { id: '1', name: 'Samsung 65" QLED 4K TV', category: 'Electronics', condition: 'good', estimatedValue: 1800, quantity: 1, notes: 'Approx. 2 years old' },
      { id: '2', name: '3-Seater Fabric Sofa', category: 'Furniture', condition: 'good', estimatedValue: 950, quantity: 1 },
      { id: '3', name: 'Armchair', category: 'Furniture', condition: 'fair', estimatedValue: 280, quantity: 2 },
      { id: '4', name: 'Wooden Coffee Table', category: 'Furniture', condition: 'good', estimatedValue: 320, quantity: 1 },
      { id: '5', name: 'Floor Lamp', category: 'Art & Decor', condition: 'excellent', estimatedValue: 120, quantity: 2 },
      { id: '6', name: 'Bookshelf (6-shelf)', category: 'Furniture', condition: 'good', estimatedValue: 180, quantity: 1 },
      { id: '7', name: 'PlayStation 5', category: 'Electronics', condition: 'excellent', estimatedValue: 650, quantity: 1 },
      { id: '8', name: 'Framed Artwork', category: 'Art & Decor', condition: 'good', estimatedValue: 150, quantity: 3 },
      { id: '9', name: 'Soundbar with Subwoofer', category: 'Electronics', condition: 'good', estimatedValue: 420, quantity: 1 },
      { id: '10', name: 'Area Rug (2m x 3m)', category: 'Furniture', condition: 'good', estimatedValue: 350, quantity: 1 },
    ],
  },
  {
    roomType: 'Kitchen',
    scanDate: new Date().toISOString(),
    imageUrl: '',
    totalValue: 0,
    items: [
      { id: '1', name: 'Freestanding Fridge (600L)', category: 'Appliances', condition: 'good', estimatedValue: 1400, quantity: 1 },
      { id: '2', name: 'Dishwasher', category: 'Appliances', condition: 'good', estimatedValue: 750, quantity: 1 },
      { id: '3', name: 'Microwave Oven', category: 'Appliances', condition: 'excellent', estimatedValue: 280, quantity: 1 },
      { id: '4', name: 'Coffee Machine (Espresso)', category: 'Appliances', condition: 'good', estimatedValue: 450, quantity: 1 },
      { id: '5', name: 'KitchenAid Stand Mixer', category: 'Appliances', condition: 'excellent', estimatedValue: 600, quantity: 1 },
      { id: '6', name: 'Knife Set (8-piece)', category: 'Appliances', condition: 'good', estimatedValue: 120, quantity: 1 },
      { id: '7', name: 'Cookware Set (6-piece)', category: 'Appliances', condition: 'fair', estimatedValue: 180, quantity: 1 },
      { id: '8', name: 'Air Fryer', category: 'Appliances', condition: 'excellent', estimatedValue: 150, quantity: 1 },
    ],
  },
  {
    roomType: 'Bedroom',
    scanDate: new Date().toISOString(),
    imageUrl: '',
    totalValue: 0,
    items: [
      { id: '1', name: 'Queen Bed Frame (Timber)', category: 'Furniture', condition: 'good', estimatedValue: 800, quantity: 1 },
      { id: '2', name: 'Mattress (Queen, Sealy)', category: 'Furniture', condition: 'good', estimatedValue: 950, quantity: 1 },
      { id: '3', name: 'Wardrobe (4-door mirrored)', category: 'Furniture', condition: 'good', estimatedValue: 1200, quantity: 1 },
      { id: '4', name: 'Bedside Table', category: 'Furniture', condition: 'good', estimatedValue: 180, quantity: 2 },
      { id: '5', name: 'Chest of Drawers (6-drawer)', category: 'Furniture', condition: 'fair', estimatedValue: 320, quantity: 1 },
      { id: '6', name: 'LED Bedside Lamp', category: 'Art & Decor', condition: 'excellent', estimatedValue: 85, quantity: 2 },
      { id: '7', name: 'MacBook Pro 14"', category: 'Electronics', condition: 'excellent', estimatedValue: 2400, quantity: 1, notes: 'M3 chip, purchased 2024' },
      { id: '8', name: 'Dyson V15 Vacuum', category: 'Appliances', condition: 'good', estimatedValue: 650, quantity: 1 },
    ],
  },
]

// Simulate processing time so the scanning state is visible
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

let demoIndex = 0

export class DemoDataSource implements DataSource {
  async analyseImage(_imageBase64: string, _mimeType: string, imageUrl?: string): Promise<ScanResult> {
    await delay(2500)
    const result = { ...DEMO_RESULTS[demoIndex % DEMO_RESULTS.length] }
    demoIndex++
    result.scanDate = new Date().toISOString()
    result.imageUrl = imageUrl ?? result.imageUrl
    result.totalValue = result.items.reduce((sum, item) => sum + item.estimatedValue * item.quantity, 0)
    return result
  }
}
