import ExcelJS from 'exceljs'
import type { ScanResult } from '../types'

function fmtCurrency(value: number) {
  return `$${value.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// Extract base64 string and extension from a data URL
function parseDataUrl(dataUrl: string): { base64: string; ext: 'png' | 'jpeg' | 'gif' } {
  const [meta, base64] = dataUrl.split(',')
  const mimeMatch = meta.match(/image\/(\w+)/)
  const mime = mimeMatch?.[1]?.toLowerCase() ?? 'jpeg'
  const ext: 'png' | 'jpeg' | 'gif' =
    mime === 'png' ? 'png' : mime === 'gif' ? 'gif' : 'jpeg'
  return { base64, ext }
}

export async function exportToExcel(result: ScanResult, selectedIds: Set<string>) {
  const items = result.items.filter((item) => selectedIds.has(item.id))
  if (items.length === 0) return

  const totalValue = items.reduce((s, i) => s + i.estimatedValue * i.quantity, 0)
  const hasPhotos = items.some(i => i.photos && i.photos.length > 0)

  const wb = new ExcelJS.Workbook()
  wb.creator = 'Home Contents Detector'
  wb.created = new Date()

  // ── Sheet 1: Items ─────────────────────────────────────────
  const ws = wb.addWorksheet('Items')

  // Header style
  const headerFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF22263A' } }
  const headerFont: Partial<ExcelJS.Font> = { bold: true, color: { argb: 'FFE8EAF0' }, size: 11 }
  const headerBorder: Partial<ExcelJS.Borders> = {
    bottom: { style: 'medium', color: { argb: 'FF5C6BFF' } },
  }

  // Column definitions
  const cols: { header: string; key: string; width: number }[] = [
    { header: 'Item Name',       key: 'name',       width: 36 },
    { header: 'Category',        key: 'category',   width: 18 },
    { header: 'Condition',       key: 'condition',  width: 12 },
    { header: 'Qty',             key: 'qty',        width: 6  },
    { header: 'Unit Value (AUD)', key: 'unitVal',   width: 18 },
    { header: 'Total Value (AUD)', key: 'totalVal', width: 18 },
    { header: 'Notes',           key: 'notes',      width: 30 },
  ]

  if (hasPhotos) {
    cols.push({ header: 'Photo 1', key: 'p1', width: 22 })
    cols.push({ header: 'Photo 2', key: 'p2', width: 22 })
    cols.push({ header: 'Photo 3', key: 'p3', width: 22 })
  }

  ws.columns = cols

  // Style header row
  const headerRow = ws.getRow(1)
  headerRow.eachCell(cell => {
    cell.fill = headerFill
    cell.font = headerFont
    cell.border = headerBorder
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
  })
  headerRow.height = 28

  // Data rows
  const IMG_SIZE = 120 // px thumbnail size in Excel

  for (const item of items) {
    const rowData: Record<string, string | number> = {
      name:      item.name,
      category:  item.category,
      condition: item.condition.charAt(0).toUpperCase() + item.condition.slice(1),
      qty:       item.quantity,
      unitVal:   item.estimatedValue,
      totalVal:  item.estimatedValue * item.quantity,
      notes:     item.notes ?? '',
    }

    const dataRow = ws.addRow(rowData)
    const rowIndex = dataRow.number

    // Format currency cells
    const unitCell = dataRow.getCell('unitVal')
    const totalCell = dataRow.getCell('totalVal')
    unitCell.numFmt = '"$"#,##0.00'
    totalCell.numFmt = '"$"#,##0.00'

    // Alternate row shading
    const rowFill: ExcelJS.Fill = rowIndex % 2 === 0
      ? { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A1D27' } }
      : { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF22263A' } }

    dataRow.eachCell(cell => {
      cell.fill = rowFill
      cell.font = { color: { argb: 'FFE8EAF0' }, size: 11 }
      cell.alignment = { vertical: 'middle', wrapText: true }
      cell.border = { bottom: { style: 'thin', color: { argb: 'FF2E3248' } } }
    })

    // Embed photos
    if (hasPhotos && item.photos && item.photos.length > 0) {
      dataRow.height = IMG_SIZE * 0.75 // row height in points (roughly px * 0.75)

      const photoCols = ['p1', 'p2', 'p3']
      item.photos.slice(0, 3).forEach((dataUrl, pi) => {
        try {
          const { base64, ext } = parseDataUrl(dataUrl)
          const imgId = wb.addImage({ base64, extension: ext })
          const colLetter = ws.getColumn(photoCols[pi]).letter
          const colIndex = ws.getColumn(photoCols[pi]).number - 1 // 0-based

          ws.addImage(imgId, {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            tl: { col: colIndex, row: rowIndex - 1 } as any,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            br: { col: colIndex + 1, row: rowIndex } as any,
            editAs: 'oneCell',
          })
          // Clear text in photo cell so image isn't obscured by text
          dataRow.getCell(colLetter).value = null
        } catch {
          // skip bad image
        }
      })
    } else {
      dataRow.height = 22
    }
  }

  // Totals row
  const totalRow = ws.addRow({
    name:     'TOTAL',
    category: '',
    condition: '',
    qty:      items.reduce((s, i) => s + i.quantity, 0),
    unitVal:  '',
    totalVal: totalValue,
    notes:    '',
  })
  totalRow.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF5C6BFF' } }
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
    cell.alignment = { vertical: 'middle' }
  })
  totalRow.getCell('totalVal').numFmt = '"$"#,##0.00'
  totalRow.height = 24

  // Freeze header
  ws.views = [{ state: 'frozen', ySplit: 1 }]

  // ── Sheet 2: Category Summary ──────────────────────────────
  const ws2 = wb.addWorksheet('Category Summary')
  ws2.columns = [
    { header: 'Category',         key: 'cat',   width: 22 },
    { header: 'Items',            key: 'count', width: 10 },
    { header: 'Total Value (AUD)', key: 'total', width: 20 },
    { header: '% of Total',       key: 'pct',   width: 14 },
  ]
  ws2.getRow(1).eachCell(cell => {
    cell.fill = headerFill; cell.font = headerFont; cell.border = headerBorder
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
  })
  ws2.getRow(1).height = 28

  const byCat: Record<string, { count: number; total: number }> = {}
  for (const item of items) {
    if (!byCat[item.category]) byCat[item.category] = { count: 0, total: 0 }
    byCat[item.category].count += item.quantity
    byCat[item.category].total += item.estimatedValue * item.quantity
  }
  Object.entries(byCat)
    .sort(([, a], [, b]) => b.total - a.total)
    .forEach(([cat, { count, total }], idx) => {
      const r = ws2.addRow({ cat, count, total, pct: `${((total / totalValue) * 100).toFixed(1)}%` })
      r.getCell('total').numFmt = '"$"#,##0.00'
      const f: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: idx % 2 === 0 ? 'FF1A1D27' : 'FF22263A' } }
      r.eachCell(c => { c.fill = f; c.font = { color: { argb: 'FFE8EAF0' }, size: 11 } })
      r.height = 22
    })
  const sumTotal = ws2.addRow({ cat: 'TOTAL', count: items.reduce((s, i) => s + i.quantity, 0), total: totalValue, pct: '100%' })
  sumTotal.getCell('total').numFmt = '"$"#,##0.00'
  sumTotal.eachCell(c => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF5C6BFF' } }; c.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 } })

  // ── Sheet 3: Scan Info ─────────────────────────────────────
  const ws3 = wb.addWorksheet('Scan Info')
  ws3.columns = [{ header: 'Field', key: 'f', width: 28 }, { header: 'Value', key: 'v', width: 32 }]
  ws3.getRow(1).eachCell(cell => { cell.fill = headerFill; cell.font = headerFont; cell.border = headerBorder; cell.alignment = { vertical: 'middle' } })
  ws3.getRow(1).height = 28
  const infoRows = [
    { f: 'Room Type', v: result.roomType },
    { f: 'Scan Date', v: new Date(result.scanDate).toLocaleString('en-AU') },
    { f: 'Total Items Selected', v: items.reduce((s, i) => s + i.quantity, 0) },
    { f: 'Total Replacement Value', v: fmtCurrency(totalValue) },
    { f: 'Generated By', v: 'Home Contents Detector' },
  ]
  infoRows.forEach((row, idx) => {
    const r = ws3.addRow(row)
    const f: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: idx % 2 === 0 ? 'FF1A1D27' : 'FF22263A' } }
    r.eachCell(c => { c.fill = f; c.font = { color: { argb: 'FFE8EAF0' }, size: 11 } })
    r.height = 22
  })

  // ── Write & download ───────────────────────────────────────
  const date = new Date(result.scanDate).toISOString().slice(0, 10)
  const baseName = `home-contents-${result.roomType.replace(/\s+/g, '-').toLowerCase()}-${date}`

  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${baseName}.xlsx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
