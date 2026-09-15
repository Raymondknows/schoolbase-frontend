'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface BroadsheetRow {
  pupilId: string
  name: string
  admissionNo: string | null
  className?: string | null
  subjectScores: Array<{ subjectId: string; totalScore: number | null }>
  total: number | null
  average: number | null
  grade: string | null
}

interface Subject {
  id: string
  name: string
}

interface SubjectStat {
  subjectId: string
  avg: number | null
  highest: number | null
  lowest: number | null
}

interface ClassInfo {
  id: string
  name: string
}

interface BroadsheetClientProps {
  assessmentId: string
  assessmentName: string
  className: string
  classes: ClassInfo[]
  selectedClassId: string
  broadsheetData: BroadsheetRow[]
  subjects: Subject[]
  subjectStats: SubjectStat[]
  classAverage: number | null
  positionMap: Record<string, number>
}

export default function BroadsheetClient({
  assessmentId,
  assessmentName,
  className,
  classes,
  selectedClassId,
  broadsheetData,
  subjects,
  subjectStats,
  classAverage,
  positionMap,
}: BroadsheetClientProps) {
  const router = useRouter()
  const [isExporting, setIsExporting] = useState(false)
  const showClassColumn = selectedClassId === 'all'

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newClassId = e.target.value
    router.push(`/admin/results/${assessmentId}/broadsheet?classId=${newClassId}`)
  }

  const exportToCSV = () => {
    setIsExporting(true)
    try {
      const headers = ['Name', ...(showClassColumn ? ['Class'] : []), 'Admission No', ...subjects.map((s) => s.name), 'Total', 'Average', 'Position', 'Grade']
      const rows = broadsheetData.map((row) => [
        row.name,
        ...(showClassColumn ? [row.className || '—'] : []),
        row.admissionNo,
        ...row.subjectScores.map((s) => (s.totalScore !== null ? Math.round(s.totalScore) : '—')),
        row.total !== null ? Math.round(row.total) : '—',
        row.average !== null ? row.average.toFixed(1) : '—',
        positionMap[row.pupilId] || '—',
        row.grade || '—',
      ])

      const csvContent = [
        [assessmentName, className].join(' - '),
        '',
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
        '',
        ['Subject', 'Class Avg', 'Highest', 'Lowest'].join(','),
        ...subjectStats.map((stat) => {
          const subj = subjects.find((s) => s.id === stat.subjectId)
          return [
            subj?.name || '—',
            stat.avg !== null ? stat.avg.toFixed(1) : '—',
            stat.highest !== null ? Math.round(stat.highest) : '—',
            stat.lowest !== null ? Math.round(stat.lowest) : '—',
          ].join(',')
        }),
      ].join('\n')

      const element = document.createElement('a')
      element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent))
      element.setAttribute('download', `broadsheet-${className}-${new Date().toISOString().split('T')[0]}.csv`)
      element.style.display = 'none'
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
    } finally {
      setIsExporting(false)
    }
  }

  const exportToPDF = () => {
    setIsExporting(true)
    try {
      const printWindow = window.open('', '', 'width=1200,height=800')
      if (!printWindow) return

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Broadsheet</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 10px; }
            h1 { font-size: 18px; margin-bottom: 5px; }
            p { font-size: 12px; margin: 0; color: #666; }
            table { border-collapse: collapse; width: 100%; margin-top: 20px; font-size: 10px; }
            th, td { border: 1px solid #ccc; padding: 6px; text-align: left; }
            th { background-color: #f0f0f0; font-weight: bold; }
            tr:nth-child(even) { background-color: #fafafa; }
            .header-section { margin-bottom: 20px; }
            .stats-section { margin-top: 20px; page-break-inside: avoid; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header-section">
            <h1>${assessmentName}</h1>
            <p><strong>Class:</strong> ${className}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Class Average:</strong> ${classAverage !== null ? classAverage.toFixed(1) : '—'}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 25px;">#</th>
                <th style="width: 120px;">Name</th>
                <th style="width: 80px;">Adm. No</th>
                ${subjects.map((s) => `<th style="width: 60px;">${s.name}</th>`).join('')}
                <th style="width: 50px;">Total</th>
                <th style="width: 50px;">Avg</th>
                <th style="width: 40px;">Pos</th>
                <th style="width: 40px;">Grade</th>
              </tr>
            </thead>
            <tbody>
              ${broadsheetData
                .map(
                  (row, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td>${row.name}</td>
                  <td>${row.admissionNo}</td>
                  ${row.subjectScores.map((s) => `<td style="text-align: right;">${s.totalScore !== null ? Math.round(s.totalScore) : '—'}</td>`).join('')}
                  <td style="text-align: right; font-weight: bold;">${row.total !== null ? Math.round(row.total) : '—'}</td>
                  <td style="text-align: right;">${row.average !== null ? row.average.toFixed(1) : '—'}</td>
                  <td style="text-align: center;">${positionMap[row.pupilId] || '—'}</td>
                  <td style="text-align: center;">${row.grade || '—'}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>

          <div class="stats-section">
            <h3 style="margin-bottom: 10px;">Subject Statistics</h3>
            <table style="width: 400px;">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Class Avg</th>
                  <th>Highest</th>
                  <th>Lowest</th>
                </tr>
              </thead>
              <tbody>
                ${subjectStats
                  .map((stat) => {
                    const subj = subjects.find((s) => s.id === stat.subjectId)
                    return `
                  <tr>
                    <td>${subj?.name || '—'}</td>
                    <td style="text-align: right;">${stat.avg !== null ? stat.avg.toFixed(1) : '—'}</td>
                    <td style="text-align: right;">${stat.highest !== null ? Math.round(stat.highest) : '—'}</td>
                    <td style="text-align: right;">${stat.lowest !== null ? Math.round(stat.lowest) : '—'}</td>
                  </tr>
                `
                  })
                  .join('')}
              </tbody>
            </table>
          </div>

          <script>
            window.print();
            window.close();
          </script>
        </body>
        </html>
      `

      printWindow.document.write(htmlContent)
      printWindow.document.close()
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-0 py-4 sm:px-8 sm:py-8 lg:px-12">
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-3">
          <label className="text-sm font-medium text-foreground">Class:</label>
          <select
            value={selectedClassId}
            onChange={handleClassChange}
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium"
          >
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={exportToCSV}
            disabled={isExporting}
            variant="outline"
            className="text-sm"
          >
            {isExporting ? 'Exporting...' : '⬇ CSV'}
          </Button>
          <Button
            onClick={exportToPDF}
            disabled={isExporting}
            variant="outline"
            className="text-sm"
          >
            {isExporting ? 'Exporting...' : '🖨 Print/PDF'}
          </Button>
        </div>
      </div>

      <div className="overflow-hidden border border-border bg-surface">
        {/* Desktop Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-background text-left text-xs uppercase tracking-[0.18em] text-muted">
              <tr>
                <th className="px-4 py-3 sticky left-0 bg-slate-50 z-10 w-12">#</th>
                <th className="px-4 py-3 sticky left-12 bg-slate-50 z-10 min-w-[150px]">Name</th>
                {showClassColumn && <th className="px-4 py-3 min-w-[120px]">Class</th>}
                <th className="px-4 py-3 min-w-[100px]">Adm. No</th>
                {subjects.map((subject) => (
                  <th key={subject.id} className="px-4 py-3 text-center min-w-[80px]">
                    {subject.name}
                  </th>
                ))}
                <th className="px-4 py-3 text-center min-w-[80px]">Total</th>
                <th className="px-4 py-3 text-center min-w-[80px]">Avg</th>
                <th className="px-4 py-3 text-center min-w-[60px]">Pos</th>
                <th className="px-4 py-3 text-center min-w-[60px]">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {broadsheetData.map((row, idx) => (
                <tr key={row.pupilId} className="hover:bg-slate-50">
                  <td className="px-4 py-3 sticky left-0 bg-white z-10 font-semibold text-foreground">{idx + 1}</td>
                  <td className="px-4 py-3 sticky left-12 bg-white z-10 font-medium text-foreground">{row.name}</td>
                  {showClassColumn && <td className="px-4 py-3 text-muted">{row.className || '—'}</td>}
                  <td className="px-4 py-3 text-muted">{row.admissionNo}</td>
                  {row.subjectScores.map((score) => (
                    <td key={score.subjectId} className="px-4 py-3 text-center text-foreground">
                      {score.totalScore !== null ? Math.round(score.totalScore) : '—'}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-center font-semibold text-foreground">
                    {row.total !== null ? Math.round(row.total) : '—'}
                  </td>
                  <td className="px-4 py-3 text-center text-foreground">
                    {row.average !== null ? row.average.toFixed(1) : '—'}
                  </td>
                  <td className="px-4 py-3 text-center font-semibold text-brand">
                    {positionMap[row.pupilId] || '—'}
                  </td>
                  <td className="px-4 py-3 text-center font-semibold text-foreground">
                    {row.grade || '—'}
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-50 font-semibold">
                <td colSpan={3} className="px-4 py-3 text-foreground">
                  Class Stats
                </td>
                {subjectStats.map((stat) => (
                  <td key={stat.subjectId} className="px-4 py-3 text-center text-sm text-muted">
                    Avg: {stat.avg !== null ? stat.avg.toFixed(1) : '—'}
                  </td>
                ))}
                <td className="px-4 py-3 text-center text-muted">
                  Overall: {classAverage !== null ? classAverage.toFixed(1) : '—'}
                </td>
                <td colSpan={3}></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="sm:hidden p-4 space-y-3">
          {broadsheetData.map((row, idx) => (
            <div key={row.pupilId} className="rounded-lg border border-border bg-slate-50 p-3">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-semibold text-foreground">#{idx + 1} {row.name}</div>
                      {showClassColumn && <div className="text-xs text-muted mt-1">Class: {row.className || '—'}</div>}
                  <div className="text-xs text-muted mt-1">Adm: {row.admissionNo}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-brand">Pos: {positionMap[row.pupilId] || '—'}</div>
                  <div className="text-xs text-foreground">{row.grade || '—'}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                {row.subjectScores.slice(0, 4).map((score) => {
                  const subj = subjects.find((s) => s.id === score.subjectId)
                  return (
                    <div key={score.subjectId} className="bg-white p-2 rounded">
                      <div className="text-muted truncate">{subj?.name}</div>
                      <div className="font-semibold text-foreground">
                        {score.totalScore !== null ? Math.round(score.totalScore) : '—'}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="border-t border-border pt-2 flex justify-between text-xs">
                <span className="text-muted">Total:</span>
                <span className="font-semibold text-foreground">
                  {row.total !== null ? Math.round(row.total) : '—'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted">Avg:</span>
                <span className="font-semibold text-foreground">
                  {row.average !== null ? row.average.toFixed(1) : '—'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Subject Statistics */}
      <div className="rounded-lg border border-border bg-white p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Subject Statistics</h3>
        <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.18em] text-muted">
              <tr>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3 text-center">Class Avg</th>
                <th className="px-4 py-3 text-center">Highest</th>
                <th className="px-4 py-3 text-center">Lowest</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {subjectStats.map((stat) => {
                const subj = subjects.find((s) => s.id === stat.subjectId)
                return (
                  <tr key={stat.subjectId} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-foreground">{subj?.name}</td>
                    <td className="px-4 py-3 text-center text-foreground">
                      {stat.avg !== null ? stat.avg.toFixed(1) : '—'}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-brand">
                      {stat.highest !== null ? Math.round(stat.highest) : '—'}
                    </td>
                    <td className="px-4 py-3 text-center text-muted">
                      {stat.lowest !== null ? Math.round(stat.lowest) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="sm:hidden space-y-2">
          {subjectStats.map((stat) => {
            const subj = subjects.find((s) => s.id === stat.subjectId)
            return (
              <div key={stat.subjectId} className="rounded-lg border border-border p-3 bg-slate-50">
                <div className="font-medium text-foreground mb-2">{subj?.name}</div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <div className="text-muted">Class Avg</div>
                    <div className="font-semibold">{stat.avg !== null ? stat.avg.toFixed(1) : '—'}</div>
                  </div>
                  <div>
                    <div className="text-muted">Highest</div>
                    <div className="font-semibold text-brand">
                      {stat.highest !== null ? Math.round(stat.highest) : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted">Lowest</div>
                    <div className="font-semibold">
                      {stat.lowest !== null ? Math.round(stat.lowest) : '—'}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
