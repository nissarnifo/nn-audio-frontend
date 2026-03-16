/**
 * Converts an array of objects to a CSV string and triggers a browser download.
 * Column order follows the keys of the first row.
 */
export function exportCsv(filename: string, rows: Record<string, unknown>[]): void {
  if (!rows.length) return

  const escape = (v: unknown): string => {
    const s = v == null ? '' : String(v)
    // Wrap in quotes if the value contains commas, quotes, or newlines
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
    return s
  }

  const headers = Object.keys(rows[0])
  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(',')),
  ]

  const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
