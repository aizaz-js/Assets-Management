/**
 * One-time data preparation script to convert Cogent Labs Excel export to
 * import-ready CSV files for the Cogent Assets import screen.
 *
 * Usage:
 *   npx ts-node scripts/prepare-import.ts --input data/inventory.json
 *
 * The JSON file should be the Excel-to-JSON export with these top-level keys:
 *   { Employees, Laptops, Mobiles, LEDs, AssetTrail }
 */

import * as fs from 'fs'
import * as path from 'path'

interface EmployeeRow {
  Name: string
  Designation: string
}

interface LaptopRow {
  'Sr No': string
  Manufacturer: string
  Status: string
  Specifications: string
  Description: string
}

interface MobileRow {
  'Sr No': string
  Manufacturer: string
  Status: string
  Specifications: string
  'PTA Status': string
  IMEI: string
}

interface LEDRow {
  'Sr No': string
  Manufacturer: string
  Status: string
  Specifications: string
}

interface AssetTrailRow {
  Name: string
  'Laptop Tag': string
  'Mobile Tag': string
  'LED Tag': string
}

interface InventoryData {
  Employees: EmployeeRow[]
  Laptops: LaptopRow[]
  Mobiles: MobileRow[]
  LEDs: LEDRow[]
  AssetTrail: AssetTrailRow[]
}

// Known passwords to strip from specs/description
const PASSWORD_PATTERNS = [
  /cogent123/gi,
  /cogentlabs1122/gi,
  /786786786/g,
  /\b1234\b/g,
  /\b\d{4,10}\b/g,
]

function stripPasswords(text: string): string {
  let cleaned = text
  for (const pattern of PASSWORD_PATTERNS) {
    cleaned = cleaned.replace(pattern, '')
  }
  return cleaned.replace(/\s{2,}/g, ' ').trim()
}

function mapStatus(excelStatus: string): string {
  const s = excelStatus?.toLowerCase().trim()
  if (s === 'allotted' || s === 'allocated') return 'allotted'
  if (s === 'available') return 'available'
  if (s === 'in repair' || s === 'repair') return 'in_repair'
  return 'available'
}

function mapPTAStatus(ptaStatus: string): string {
  const s = ptaStatus?.toLowerCase().trim()
  if (s === 'approved' || s === 'pta approved') return 'pta_approved'
  if (s === 'non-pta' || s === 'non_pta' || s === 'non pta') return 'non_pta'
  return 'unknown'
}

function csvRow(values: string[]): string {
  return values
    .map((v) => {
      const str = String(v ?? '')
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    })
    .join(',')
}

function main() {
  const args = process.argv.slice(2)
  const inputIdx = args.indexOf('--input')
  if (inputIdx === -1 || !args[inputIdx + 1]) {
    console.error('Usage: npx ts-node scripts/prepare-import.ts --input <path-to-json>')
    process.exit(1)
  }

  const inputPath = args[inputIdx + 1]
  const outputDir = path.join(process.cwd(), 'data', 'output')
  fs.mkdirSync(outputDir, { recursive: true })

  const raw = fs.readFileSync(inputPath, 'utf-8')
  const data: InventoryData = JSON.parse(raw)

  // ---- EMPLOYEES CSV ----
  const employeeHeaders = ['name', 'designation', 'engagement_type', 'status']
  const employeeRows = (data.Employees ?? []).map((e) => [
    e.Name,
    e.Designation,
    'permanent',
    'active',
  ])
  const employeeCSV = [
    csvRow(employeeHeaders),
    ...employeeRows.map(csvRow),
  ].join('\n')
  fs.writeFileSync(path.join(outputDir, 'import-employees.csv'), employeeCSV)
  console.log(`✓ Wrote import-employees.csv (${employeeRows.length} rows)`)

  // ---- ASSETS CSV ----
  const assetHeaders = [
    'asset_tag', 'asset_type', 'classification', 'price_pkr', 'vendor_name',
    'vendor_phone', 'invoice_number', 'purchase_date', 'warranty_type',
    'specs', 'serial_number', 'pta_status', 'status', 'condition', 'notes',
  ]

  const assetRows: string[][] = []

  for (const row of (data.Laptops ?? [])) {
    assetRows.push([
      row['Sr No'] ?? '',
      'laptop',
      'employee_allocated',
      '',
      row.Manufacturer ?? '',
      '', '', '',
      'none',
      row.Specifications ?? '',
      '',
      '',
      mapStatus(row.Status),
      'good',
      stripPasswords(row.Description ?? ''),
    ])
  }

  for (const row of (data.Mobiles ?? [])) {
    assetRows.push([
      row['Sr No'] ?? '',
      'mobile',
      'employee_allocated',
      '',
      row.Manufacturer ?? '',
      '', '', '',
      'none',
      row.Specifications ?? '',
      row.IMEI ?? '',
      mapPTAStatus(row['PTA Status'] ?? ''),
      mapStatus(row.Status),
      'good',
      '',
    ])
  }

  for (const row of (data.LEDs ?? [])) {
    assetRows.push([
      row['Sr No'] ?? '',
      'monitor',
      'employee_allocated',
      '',
      row.Manufacturer ?? '',
      '', '', '',
      'none',
      row.Specifications ?? '',
      '',
      '',
      mapStatus(row.Status),
      'good',
      '',
    ])
  }

  const assetCSV = [csvRow(assetHeaders), ...assetRows.map(csvRow)].join('\n')
  fs.writeFileSync(path.join(outputDir, 'import-assets.csv'), assetCSV)
  console.log(`✓ Wrote import-assets.csv (${assetRows.length} rows)`)

  // ---- ASSIGNMENTS CSV ----
  const assignmentHeaders = ['employee_name', 'laptop_tag', 'mobile_tag', 'led_tag']
  const assignmentRows = (data.AssetTrail ?? []).map((r) => [
    r.Name ?? '',
    r['Laptop Tag'] ?? '',
    r['Mobile Tag'] ?? '',
    r['LED Tag'] ?? '',
  ])
  const assignmentCSV = [
    csvRow(assignmentHeaders),
    ...assignmentRows.map(csvRow),
  ].join('\n')
  fs.writeFileSync(path.join(outputDir, 'import-assignments.csv'), assignmentCSV)
  console.log(`✓ Wrote import-assignments.csv (${assignmentRows.length} rows)`)

  console.log(`\nOutput written to: ${outputDir}`)
  console.log('\nNext steps:')
  console.log('  1. Review generated CSVs in data/output/')
  console.log('  2. Use the Import screen to upload import-assets.csv')
  console.log('  3. Employee profiles auto-create on first Google login')
  console.log('  4. Apply import-assignments.csv to link assets to users')
}

main()
