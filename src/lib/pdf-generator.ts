import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface PdfExportOptions {
  userQuestion: string
  sqlQuery?: string | null
  aiAnswer: string
  confidence?: string | null
  responseTime?: number | null
  results?: Record<string, unknown>[]
}

export function generateKspPdfReport(options: PdfExportOptions): void {
  const { userQuestion, sqlQuery, aiAnswer, confidence, responseTime, results } = options
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const primaryColor: [number, number, number] = [26, 35, 126]
  const goldColor: [number, number, number] = [212, 175, 55]

  // Header Banner
  doc.setFillColor(...primaryColor)
  doc.rect(0, 0, 210, 28, 'F')
  doc.setFillColor(...goldColor)
  doc.rect(0, 28, 210, 2, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('KARNATAKA STATE POLICE', 14, 13)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('CRIME INTELLIGENCE PLATFORM — OFFICIAL REPORT', 14, 20)

  const timestamp = new Date().toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  })
  doc.setFontSize(8)
  doc.text(`Generated: ${timestamp}`, 196, 20, { align: 'right' })

  let y = 38

  // Section: Query Details
  doc.setTextColor(26, 35, 126)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('1. USER QUERY & METADATA', 14, y)
  y += 3

  doc.setFillColor(245, 247, 250)
  doc.roundedRect(14, y, 182, 22, 2, 2, 'F')
  doc.setDrawColor(220, 225, 230)
  doc.roundedRect(14, y, 182, 22, 2, 2, 'D')

  doc.setTextColor(40, 40, 40)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('Query:', 18, y + 6)
  doc.setFont('helvetica', 'normal')

  const splitQuestion = doc.splitTextToSize(userQuestion, 168)
  doc.text(splitQuestion, 32, y + 6)

  const metaY = y + 15
  doc.setFontSize(8)

  doc.setFont('helvetica', 'bold')
  doc.text('Confidence: ', 18, metaY)
  doc.setFont('helvetica', 'normal')
  const confText = (confidence || 'high').toUpperCase()
  doc.text(confText, 37, metaY)

  doc.setFont('helvetica', 'bold')
  doc.text('Execution Time: ', 80, metaY)
  doc.setFont('helvetica', 'normal')
  doc.text(`${((responseTime || 120) / 1000).toFixed(2)}s`, 106, metaY)

  y += 28

  // Section: Executive Summary
  doc.setTextColor(26, 35, 126)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('2. AI EXECUTIVE SUMMARY', 14, y)
  y += 5

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(40, 40, 40)
  const cleanAnswer = aiAnswer.replace(/\*\*/g, '').replace(/```[\s\S]*?```/g, '').trim()
  const splitAnswer = doc.splitTextToSize(cleanAnswer, 182)
  doc.text(splitAnswer, 14, y)
  y += splitAnswer.length * 4.5 + 6

  // Section: Generated SQL
  if (sqlQuery) {
    doc.setTextColor(26, 35, 126)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('3. GENERATED SQL QUERY', 14, y)
    y += 5

    const cleanSqlText = sqlQuery.replace(/```sql/g, '').replace(/```/g, '').trim()
    const splitSql = doc.splitTextToSize(cleanSqlText, 174)
    const sqlBoxHeight = Math.max(14, splitSql.length * 4 + 6)

    doc.setFillColor(30, 30, 46)
    doc.roundedRect(14, y, 182, sqlBoxHeight, 2, 2, 'F')

    doc.setFont('courier', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(166, 226, 46)
    doc.text(splitSql, 18, y + 5)
    y += sqlBoxHeight + 8
  }

  // Section: Results Table
  if (results && results.length > 0) {
    doc.setTextColor(26, 35, 126)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text(`4. QUERY RESULTS (${results.length} records)`, 14, y)
    y += 4

    const headers = Object.keys(results[0]).map((h) =>
      h.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim().toUpperCase()
    )
    const rows = results.slice(0, 25).map((row) =>
      Object.values(row).map((val) => (val === null || val === undefined ? '—' : String(val)))
    )

    autoTable(doc, {
      startY: y,
      head: [headers],
      body: rows,
      theme: 'striped',
      headStyles: { fillColor: primaryColor, textColor: 255, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7, textColor: 50 },
      margin: { left: 14, right: 14 },
    })
  }

  // Footer Page Numbers
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(120, 120, 120)
    doc.text(`Page ${i} of ${totalPages}`, 196, 290, { align: 'right' })
    doc.text('RESTRICTED — KARNATAKA STATE POLICE INTERNAL USE ONLY', 14, 290)
  }

  const cleanFilename = userQuestion
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .slice(0, 30)
  doc.save(`KSP_Report_${cleanFilename || 'query'}.pdf`)
}
