// src/utils/excelExport.js
import * as XLSX from 'xlsx'

export const exportBoqToExcel = (project, categories) => {
  const wb = XLSX.utils.book_new()

  // === Summary Sheet ===
  const summaryRows = [
    ['Project Name:', project?.name || 'N/A'],
    ['Location:', project?.location || 'N/A'],
    [
      'Project Lead:',
      `${project?.projectLead?.firstName || ''} ${project?.projectLead?.lastName || ''}`,
    ],
    ['', ''],
    ['CATEGORY SUMMARY', ''],
    ['Category', 'Contract Sum (KES)', 'Valued Amount (KES)', 'Progress (%)'],
  ]

  let grandTotal = 0
  let grandValued = 0

  categories.forEach((cat) => {
    const progress =
      cat.summary.total > 0 ? ((cat.summary.valued / cat.summary.total) * 100).toFixed(2) : 0

    summaryRows.push([cat.name, cat.summary.total || 0, cat.summary.valued || 0, `${progress}%`])

    grandTotal += cat.summary.total || 0
    grandValued += cat.summary.valued || 0
  })

  summaryRows.push(['', '', '', ''])
  summaryRows.push([
    'GRAND TOTAL',
    grandTotal,
    grandValued,
    grandTotal > 0 ? ((grandValued / grandTotal) * 100).toFixed(2) + '%' : '0%',
  ])

  const summaryWS = XLSX.utils.aoa_to_sheet(summaryRows)
  XLSX.utils.book_append_sheet(wb, summaryWS, 'Summary')

  categories.forEach((cat) => {
    const rows = [
      [
        'Item No.',
        'Description',
        'Unit',
        'Quantity',
        'Rate (KES)',
        'Total (KES)',
        'Progress (%)',
        'Valued Amount (KES)',
      ],
    ]

    cat.items.forEach((item) => {
      rows.push([
        item.itemNumber || '',
        item.description || '',
        item.unit || '',
        item.quantity || 0,
        item.rate || 0,
        item.total || 0,
        item.progressPercentage || 0,
        item.valuedAmount || 0,
      ])
    })

    // Category total row
    rows.push([])
    rows.push([
      'CATEGORY TOTAL →',
      '',
      '',
      '',
      '',
      cat.summary.total || 0,
      '',
      cat.summary.valued || 0,
    ])

    const ws = XLSX.utils.aoa_to_sheet(rows)
    const sheetName = cat.name.length > 31 ? cat.name.substring(0, 31) : cat.name
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
  })

  // Download file
  const fileName = `${project?.name.replace(/[/\\?*[\]]/g, '') || 'Project'}_BOQ_${new Date().toISOString().slice(0, 10)}.xlsx`
  XLSX.writeFile(wb, fileName)
}
