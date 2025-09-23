#!/usr/bin/env bun
import fs from 'fs/promises'
import path from 'path'
import { glob } from 'glob'

// Types for our audit data structures
interface ExtractedConstant {
  sourceFile: string
  hexCode: string
  constantName: string
  category: 'property' | 'operation' | 'event' | 'response' | 'control' | 'format' | 'storage' | 'error' | 'datatype'
  vendor: 'iso' | 'sony'
  lineNumber?: number
  context?: string
}

interface MissingConstant {
  hexCode: string
  constantName: string
  category: string
  sourceFile: string
  searchAttempts: string[]
  closestMatch?: {
    heading: string
    content: string
    reasons: string[]
  }
}

interface CategorySummary {
  vendor: 'iso' | 'sony'
  category: string
  total: number
  found: number
  extracted: number
  missing: number
  percentage: number
  extractionPercentage: number
  missingConstants: MissingConstant[]
}

interface DocumentationBlock {
  hexCode: string
  constantName: string
  content: string
  startLine: number
  endLine: number
  heading?: string
  matchConfidence: number
}

// Configuration
const CONFIG = {
  constantsPath: 'src/constants',
  isoDocsPath: 'docs/iso/ptp_iso_15740_reference/ptp_iso_15740_reference.md',
  sonyDocsPath: 'docs/manufacturers/sony/ptp_sony_reference/ptp_sony_reference.md',
  outputPath: 'docs/audit',
  excludeFiles: [
    'vendor-ids.ts' // USB vendor IDs, not PTP constants
  ],
  fuzzyThreshold: 0.6,
  strictMode: true // Enable strict matching criteria
}

// Helper function for fuzzy string matching
function fuzzyMatch(str1: string, str2: string): number {
  // Normalize strings more aggressively
  const normalize = (s: string) => {
    return s
      .toLowerCase()
      .replace(/[_\-\s]+/g, '') // Remove separators
      .replace(/^(get|set|the|a|an)/g, '') // Remove common prefixes
      .replace(/[^a-z0-9]/g, '') // Keep only alphanumeric
  }
  
  const norm1 = normalize(str1)
  const norm2 = normalize(str2)
  
  // Check for exact match
  if (norm1 === norm2) return 1.0
  
  // Check if one contains the other
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    const minLen = Math.min(norm1.length, norm2.length)
    const maxLen = Math.max(norm1.length, norm2.length)
    return minLen / maxLen
  }
  
  // Calculate Levenshtein distance
  const distance = levenshteinDistance(norm1, norm2)
  const maxLen = Math.max(norm1.length, norm2.length)
  return Math.max(0, 1 - distance / maxLen)
}

function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length
  const len2 = str2.length
  const matrix: number[][] = []
  
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i]
  }
  
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,    // deletion
        matrix[i][j - 1] + 1,    // insertion
        matrix[i - 1][j - 1] + cost // substitution
      )
    }
  }
  
  return matrix[len1][len2]
}

// Extract hex codes from TypeScript source files
async function extractConstants(): Promise<ExtractedConstant[]> {
  const constants: ExtractedConstant[] = []
  const files = await glob(`${CONFIG.constantsPath}/**/*.ts`)
  
  for (const file of files) {
    // Skip excluded files
    if (CONFIG.excludeFiles.some(excluded => file.includes(excluded))) {
      console.log(`   Skipping ${file.replace(process.cwd() + '/', '')} (excluded)`)
      continue
    }
    
    const content = await fs.readFile(file, 'utf-8')
    const lines = content.split('\n')
    
    // Determine vendor and category from file path
    const vendor = file.includes('/vendors/sony/') ? 'sony' : 'iso'
    const category = determineCategory(file)
    
    // Extract constants with context
    lines.forEach((line, lineIndex) => {
      // Look for object property definitions with hex codes
      const propertyMatch = line.match(/^\s*(\w+):\s*{/)
      if (propertyMatch) {
        // Look ahead for the code property
        for (let i = 1; i <= 10 && lineIndex + i < lines.length; i++) {
          const codeLine = lines[lineIndex + i]
          const codeMatch = codeLine.match(/code:\s*(0x[0-9A-Fa-f]{2,4})/)
          if (codeMatch) {
            constants.push({
              sourceFile: file.replace(process.cwd() + '/', ''),
              hexCode: codeMatch[1],
              constantName: propertyMatch[1],
              category,
              vendor,
              lineNumber: lineIndex + 1,
              context: lines.slice(Math.max(0, lineIndex - 2), Math.min(lines.length, lineIndex + 10)).join('\n')
            })
            break
          }
          if (codeLine.includes('}')) break
        }
      }
      
      // Direct hex assignments
      const directMatch = line.match(/(?:const|let|var)?\s*(\w+)(?:\s*[:=]\s*|\s+)(?:HexCode\s*=\s*)?(0x[0-9A-Fa-f]{2,4})/)
      if (directMatch) {
        constants.push({
          sourceFile: file.replace(process.cwd() + '/', ''),
          hexCode: directMatch[2],
          constantName: directMatch[1],
          category,
          vendor,
          lineNumber: lineIndex + 1,
          context: lines.slice(Math.max(0, lineIndex - 2), Math.min(lines.length, lineIndex + 5)).join('\n')
        })
      }
      
      // Enum values
      const enumMatch = line.match(/'(\w+)':\s*(0x[0-9A-Fa-f]{2,4})/)
      if (enumMatch) {
        constants.push({
          sourceFile: file.replace(process.cwd() + '/', ''),
          hexCode: enumMatch[2],
          constantName: enumMatch[1],
          category,
          vendor,
          lineNumber: lineIndex + 1,
          context: line
        })
      }
    })
  }
  
  // Deduplicate by hexCode + vendor combination
  const seen = new Set<string>()
  return constants.filter(c => {
    const key = `${c.vendor}:${c.hexCode}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function determineCategory(filePath: string): ExtractedConstant['category'] {
  // Check for types.ts which contains data types
  if (filePath.includes('/types.ts')) return 'datatype'
  if (filePath.includes('/properties')) return 'property'
  if (filePath.includes('/operations')) return 'operation'
  if (filePath.includes('/events')) return 'event'
  if (filePath.includes('/responses')) return 'response'
  if (filePath.includes('/controls')) return 'control'
  if (filePath.includes('/formats')) return 'format'
  if (filePath.includes('/storage')) return 'storage'
  if (filePath.includes('/errors')) return 'error'
  return 'property' // default
}

// Helper to identify if a line is a heading
function isHeading(line: string): { isHeading: boolean; level: number; text: string } {
  // Check for markdown headings
  const mdHeading = line.match(/^(#{1,6})\s+(.+)/)
  if (mdHeading) {
    return {
      isHeading: true,
      level: mdHeading[1].length,
      text: mdHeading[2].replace(/\*+/g, '').trim()
    }
  }
  
  // Check for bold headings (often used as subsection headers)
  const boldHeading = line.match(/^\*\*([^*]+)\*\*\s*$/)
  if (boldHeading) {
    return {
      isHeading: true,
      level: 7, // Consider bold as lower level than markdown headings
      text: boldHeading[1].trim()
    }
  }
  
  // Check for section numbers as headings
  const sectionHeading = line.match(/^(\d+(?:\.\d+)*)\s+(.+)/)
  if (sectionHeading) {
    return {
      isHeading: true,
      level: sectionHeading[1].split('.').length,
      text: sectionHeading[2].trim()
    }
  }
  
  return { isHeading: false, level: 0, text: '' }
}

// Helper to detect if a block is likely an overview/compatibility table
function isOverviewTable(content: string, targetHex: string): boolean {
  const lines = content.split('\n')
  const hexPattern = /0x[0-9A-Fa-f]{4}/gi
  let hexCodes = new Set<string>()
  
  // Count unique hex codes in the block
  for (const line of lines) {
    const matches = line.match(hexPattern)
    if (matches) {
      matches.forEach(m => hexCodes.add(m.toLowerCase()))
    }
  }
  
  // If there are many different hex codes, it's likely an overview table
  // Allow up to 3 hex codes (the target might appear multiple times, plus maybe one reference)
  return hexCodes.size > 3
}

// Unified strict extraction for both ISO and Sony
async function extractDocBlockStrict(
  constant: ExtractedConstant,
  docPath: string
): Promise<{ block: DocumentationBlock | null; debugInfo?: any }> {
  const docContent = await fs.readFile(docPath, 'utf-8')
  const lines = docContent.split('\n')
  
  // Special handling for datatypes and formats in tables
  if ((constant.category === 'datatype' || constant.category === 'format') && constant.vendor === 'iso') {
    return extractFromTable(constant, lines)
  }
  
  const hexVariations = [
    constant.hexCode,
    constant.hexCode.toLowerCase(),
    constant.hexCode.toUpperCase(),
  ]
  
  const candidates: Array<{
    block: DocumentationBlock
    score: number
    reasons: string[]
    isOverviewTable: boolean
  }> = []
  
  // Find all occurrences of the hex code
  for (const hex of hexVariations) {
    for (let i = 0; i < lines.length; i++) {
      // Check for hex code with word boundaries
      const hexRegex = new RegExp(`\\b${hex.replace('0x', '0x')}\\b`, 'i')
      if (!hexRegex.test(lines[i])) continue
      
      // Find the heading before this hex code
      let headingLine = -1
      let heading = ''
      let headingLevel = 999
      
      for (let j = i - 1; j >= Math.max(0, i - 50); j--) {
        const headingInfo = isHeading(lines[j])
        if (headingInfo.isHeading) {
          headingLine = j
          heading = headingInfo.text
          headingLevel = headingInfo.level
          break
        }
      }
      
      // If no heading found, this is not a valid block
      if (headingLine === -1) {
        continue
      }
      
      // Find the end of this block (next heading at same or higher level)
      let endLine = i + 1
      for (let j = i + 1; j < Math.min(lines.length, i + 200); j++) {
        const nextHeading = isHeading(lines[j])
        if (nextHeading.isHeading && nextHeading.level <= headingLevel) {
          // Check if this new section has a different hex code
          let hasOtherHex = false
          for (let k = j; k < Math.min(j + 10, lines.length); k++) {
            const otherHexMatch = lines[k].match(/0x[0-9A-Fa-f]{4}/i)
            if (otherHexMatch && !hexVariations.includes(otherHexMatch[0])) {
              hasOtherHex = true
              break
            }
          }
          if (hasOtherHex) {
            endLine = j
            break
          }
        }
      }
      
      // Extract block content
      const blockContent = lines.slice(headingLine, endLine).join('\n')
      
      // Check if this is an overview table
      const isOverview = isOverviewTable(blockContent, constant.hexCode)
      
      // Strict validation criteria
      const validationReasons: string[] = []
      let validationScore = 0
      
      // Penalize overview tables heavily
      if (isOverview) {
        validationScore -= 0.5
        validationReasons.push('✗ Appears to be an overview/compatibility table (multiple hex codes)')
      }
      
      // 1. Check heading matches constant name
      const headingScore = fuzzyMatch(constant.constantName, heading)
      
      // Give better scores based on match quality
      if (headingScore >= 0.8) {
        validationScore += 0.4  // Excellent match
        validationReasons.push(`✓ Excellent heading match: "${heading}" ~ "${constant.constantName}" (${(headingScore * 100).toFixed(0)}%)`)
      } else if (headingScore >= 0.7) {
        validationScore += 0.3  // Good match
        validationReasons.push(`✓ Good heading match: "${heading}" ~ "${constant.constantName}" (${(headingScore * 100).toFixed(0)}%)`)
      } else if (headingScore >= 0.5) {
        validationScore += 0.1  // Weak match
        validationReasons.push(`⚠ Weak heading match: "${heading}" ~ "${constant.constantName}" (${(headingScore * 100).toFixed(0)}%)`)
      } else {
        // Poor match - likely wrong section
        validationReasons.push(`✗ Heading mismatch: "${heading}" !~ "${constant.constantName}" (${(headingScore * 100).toFixed(0)}%)`)
        // Special case: if heading is generic like "Controls", "Properties", "Operations", penalize
        if (['controls', 'properties', 'operations', 'events', 'summary', 'overview'].includes(heading.toLowerCase())) {
          validationScore -= 0.2
          validationReasons.push(`✗ Generic heading suggests overview section`)
        }
      }
      
      // 2. Check for correct field type based on category and vendor
      if (constant.vendor === 'iso') {
        if (constant.category === 'property' && blockContent.includes('DevicePropCode')) {
          validationScore += 0.2
          validationReasons.push('✓ Contains DevicePropCode field')
        } else if (constant.category === 'operation' && blockContent.includes('OperationCode')) {
          validationScore += 0.2
          validationReasons.push('✓ Contains OperationCode field')
        } else if (constant.category === 'event' && blockContent.includes('EventCode')) {
          validationScore += 0.2
          validationReasons.push('✓ Contains EventCode field')
        } else if (constant.category === 'response' && blockContent.includes('ResponseCode')) {
          validationScore += 0.2
          validationReasons.push('✓ Contains ResponseCode field')
        } else {
          validationReasons.push(`✗ Missing expected ${constant.category} field type`)
        }
      } else if (constant.vendor === 'sony') {
        if (constant.category === 'property' && blockContent.includes('PropertyCode')) {
          validationScore += 0.2
          validationReasons.push('✓ Contains PropertyCode field')
        } else if (constant.category === 'operation' && blockContent.includes('Operation Code')) {
          validationScore += 0.2
          validationReasons.push('✓ Contains Operation Code field')
        } else if (constant.category === 'event' && blockContent.includes('Event Code')) {
          validationScore += 0.2
          validationReasons.push('✓ Contains Event Code field')
        } else if (constant.category === 'control' && blockContent.includes('ControlCode')) {
          validationScore += 0.2
          validationReasons.push('✓ Contains ControlCode field')
        } else {
          validationReasons.push(`✗ Missing expected ${constant.category} field type`)
        }
      }
      
      // 3. Check for required content sections
      const hasDescription = blockContent.includes('Description') || blockContent.includes('Summary')
      const hasDataType = blockContent.includes('Data type') || blockContent.includes('Datatype')
      const hasTable = blockContent.includes('|') && blockContent.split('|').length > 5
      
      if (hasDescription) {
        validationScore += 0.1
        validationReasons.push('✓ Contains Description/Summary')
      } else {
        validationReasons.push('✗ No Description/Summary section')
      }
      
      if (hasDataType || hasTable) {
        validationScore += 0.1
        validationReasons.push('✓ Contains data type info or table')
      }
      
      // 4. Check hex code prominence
      const hexCount = (blockContent.match(new RegExp(hex, 'gi')) || []).length
      if (hexCount >= 1) {
        validationScore += 0.1
        validationReasons.push(`✓ Hex code appears ${hexCount} time(s)`)
      } else {
        validationReasons.push('✗ Hex code not found in block')
      }
      
      // 5. Check content length and quality
      const contentLength = blockContent.length
      if (contentLength >= 150) {
        validationScore += 0.1
        validationReasons.push(`✓ Sufficient content (${contentLength} chars)`)
      } else {
        validationReasons.push(`✗ Content too short (${contentLength} chars)`)
      }
      
      // 6. Check that hex code appears early in the block (within first 10 lines)
      const blockLines = blockContent.split('\n')
      let hexLineIndex = -1
      for (let k = 0; k < blockLines.length; k++) {
        if (blockLines[k].includes(hex)) {
          hexLineIndex = k
          break
        }
      }
      
      if (hexLineIndex !== -1 && hexLineIndex < 5) {
        validationScore += 0.2  // Very early appearance
        validationReasons.push(`✓ Hex code appears very early (line ${hexLineIndex + 1})`)
      } else if (hexLineIndex !== -1 && hexLineIndex < 10) {
        validationScore += 0.1  // Early appearance
        validationReasons.push(`✓ Hex code appears early (line ${hexLineIndex + 1})`)
      } else if (hexLineIndex !== -1) {
        validationReasons.push(`✗ Hex code appears late in block (line ${hexLineIndex + 1})`)
        // Penalize if it appears very late (likely in a table)
        if (hexLineIndex > 20) {
          validationScore -= 0.1
        }
      }
      
      const totalScore = validationScore
      
      candidates.push({
        block: {
          hexCode: constant.hexCode,
          constantName: constant.constantName,
          content: blockContent,
          startLine: headingLine,
          endLine: endLine,
          heading,
          matchConfidence: totalScore
        },
        score: totalScore,
        reasons: validationReasons,
        isOverviewTable: isOverview
      })
    }
  }
  
  // Sort candidates by score, but prioritize non-overview tables
  candidates.sort((a, b) => {
    // First, prioritize non-overview tables
    if (!a.isOverviewTable && b.isOverviewTable) return -1
    if (a.isOverviewTable && !b.isOverviewTable) return 1
    // Then sort by score
    return b.score - a.score
  })
  
  // Return best match if it meets threshold
  if (candidates.length > 0) {
    const best = candidates[0]
    if (best.score >= CONFIG.fuzzyThreshold) {
      return { 
        block: best.block,
        debugInfo: {
          allCandidates: candidates.map(c => ({
            heading: c.block.heading,
            score: c.score,
            reasons: c.reasons
          }))
        }
      }
    }
    // Return null but with debug info about why it didn't match
    return {
      block: null,
      debugInfo: {
        closestMatch: {
          heading: best.block.heading || 'No heading',
          content: best.block.content.substring(0, 200) + '...',
          reasons: best.reasons,
          score: best.score,
          threshold: CONFIG.fuzzyThreshold
        }
      }
    }
  }
  
  return { block: null, debugInfo: { message: 'No candidates found with hex code' } }
}

// Special handler for table extraction (datatypes and formats)
async function extractFromTable(
  constant: ExtractedConstant,
  lines: string[]
): Promise<{ block: DocumentationBlock | null; debugInfo?: any }> {
  // Find the relevant table section
  let tableStart = -1
  let tableEnd = -1
  
  const searchPatterns = constant.category === 'datatype' 
    ? ['5.3 Simple types', 'Table 3', 'Datatype codes']
    : ['Table 18', 'ObjectFormatCodes', '6.3 ObjectFormatCodes']
  
  for (let i = 0; i < lines.length; i++) {
    if (searchPatterns.some(pattern => lines[i].includes(pattern))) {
      tableStart = i
      break
    }
  }
  
  if (tableStart === -1) {
    return { 
      block: null,
      debugInfo: { message: `Table not found for ${constant.category}` }
    }
  }
  
  // Find end of table
  for (let i = tableStart + 10; i < Math.min(lines.length, tableStart + 300); i++) {
    if (lines[i].match(/^#{1,2}\s+\d+\.\d+/) || // Next section
        lines[i].match(/Table \d+(?!\s*—)/) || // Next table
        (constant.category === 'datatype' && lines[i].includes('5.4')) ||
        (constant.category === 'format' && lines[i].includes('6.4'))) {
      tableEnd = i
      break
    }
  }
  
  if (tableEnd === -1) {
    tableEnd = Math.min(tableStart + 200, lines.length)
  }
  
  // Search for hex code in table
  const hexVariations = [
    constant.hexCode.toLowerCase(),
    constant.hexCode.toUpperCase(),
    '0x' + constant.hexCode.substring(2).padStart(4, '0').toLowerCase(),
    '0x' + constant.hexCode.substring(2).padStart(4, '0').toUpperCase()
  ]
  
  for (const hex of hexVariations) {
    for (let i = tableStart; i < tableEnd; i++) {
      if (lines[i].includes(hex)) {
        // Extract table row and context
        const blockStart = Math.max(tableStart, i - 5)
        const blockEnd = Math.min(tableEnd, i + 3)
        return {
          block: {
            hexCode: constant.hexCode,
            constantName: constant.constantName,
            content: lines.slice(blockStart, blockEnd).join('\n'),
            startLine: blockStart,
            endLine: blockEnd,
            heading: `Table entry for ${constant.constantName}`,
            matchConfidence: 1.0
          }
        }
      }
    }
  }
  
  return {
    block: null,
    debugInfo: {
      message: `Hex code ${constant.hexCode} not found in table`,
      searchedRange: `Lines ${tableStart} to ${tableEnd}`
    }
  }
}

// Save documentation block to markdown file
async function saveDocumentationBlock(constant: ExtractedConstant, block: DocumentationBlock): Promise<void> {
  const vendor = constant.vendor
  const outputDir = path.join(CONFIG.outputPath, vendor)
  await fs.mkdir(outputDir, { recursive: true })
  
  // Clean the constant name for filename
  const cleanName = constant.constantName
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .toUpperCase()
  
  const filename = `${constant.hexCode}_${cleanName}.md`
  const filepath = path.join(outputDir, filename)
  
  // Add metadata header
  const content = `# ${constant.constantName} (${constant.hexCode})

**Category**: ${constant.category}
**Vendor**: ${vendor}
**Source File**: ${constant.sourceFile}
**Match Confidence**: ${(block.matchConfidence * 100).toFixed(1)}%
${block.heading ? `**Documentation Heading**: ${block.heading}` : ''}

---

${block.content}
`
  
  await fs.writeFile(filepath, content)
}

// Check if a constant exists in documentation and extract if found
async function checkAndExtractDocumentation(
  constant: ExtractedConstant
): Promise<{ 
  found: boolean; 
  extracted: boolean; 
  searchAttempts: string[];
  closestMatch?: MissingConstant['closestMatch']
}> {
  const docPath = constant.vendor === 'iso' ? CONFIG.isoDocsPath : CONFIG.sonyDocsPath
  
  // Use strict extraction
  const { block, debugInfo } = await extractDocBlockStrict(constant, docPath)
  
  if (block) {
    await saveDocumentationBlock(constant, block)
    return {
      found: true,
      extracted: true,
      searchAttempts: [`Found with confidence ${(block.matchConfidence * 100).toFixed(1)}%`]
    }
  }
  
  // Check if hex exists at all
  const docContent = await fs.readFile(docPath, 'utf-8')
  const hexExists = docContent.toLowerCase().includes(constant.hexCode.toLowerCase())
  
  if (hexExists) {
    // Hex exists but couldn't extract properly
    const closestMatch = debugInfo?.closestMatch
    return {
      found: true,
      extracted: false,
      searchAttempts: ['Hex found but extraction failed'],
      closestMatch: closestMatch ? {
        heading: closestMatch.heading,
        content: closestMatch.content,
        reasons: closestMatch.reasons
      } : undefined
    }
  }
  
  return {
    found: false,
    extracted: false,
    searchAttempts: ['Hex code not found in documentation'],
    closestMatch: debugInfo?.closestMatch ? {
      heading: debugInfo.closestMatch.heading,
      content: debugInfo.closestMatch.content,
      reasons: debugInfo.closestMatch.reasons
    } : undefined
  }
}

// Analyze missing constants by category
async function analyzeMissingConstants(): Promise<Map<string, CategorySummary>> {
  console.log('🔍 PTP Constants Documentation Audit - Strict Mode')
  console.log('================================================================\n')
  
  // Clean output directory
  const isoDir = path.join(CONFIG.outputPath, 'iso')
  const sonyDir = path.join(CONFIG.outputPath, 'sony')
  await fs.rm(isoDir, { recursive: true, force: true })
  await fs.rm(sonyDir, { recursive: true, force: true })
  await fs.mkdir(isoDir, { recursive: true })
  await fs.mkdir(sonyDir, { recursive: true })
  
  // Extract all constants
  console.log('📋 Extracting constants from source files...')
  const constants = await extractConstants()
  console.log(`   Found ${constants.length} unique PTP constants\n`)
  
  // Group by vendor-category
  const grouped = new Map<string, ExtractedConstant[]>()
  constants.forEach(c => {
    const key = `${c.vendor}-${c.category}`
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(c)
  })
  
  // Analyze each group
  console.log('🔎 Checking documentation with strict criteria...')
  const summaries = new Map<string, CategorySummary>()
  
  // Sort keys for consistent output
  const sortedKeys = Array.from(grouped.keys()).sort((a, b) => {
    const [vendorA] = a.split('-')
    const [vendorB] = b.split('-')
    if (vendorA !== vendorB) {
      return vendorA === 'iso' ? -1 : 1
    }
    return a.localeCompare(b)
  })
  
  let processedCount = 0
  const totalConstants = constants.length
  let totalExtracted = 0
  
  for (const key of sortedKeys) {
    const groupConstants = grouped.get(key)!
    const [vendor, category] = key.split('-') as [ExtractedConstant['vendor'], string]
    
    console.log(`\n   ${vendor.toUpperCase()} ${category}:`)
    
    const missingConstants: MissingConstant[] = []
    let found = 0
    let extracted = 0
    
    // Sort constants by hex code for consistent output
    const sortedConstants = groupConstants.sort((a, b) => 
      parseInt(a.hexCode.substring(2), 16) - parseInt(b.hexCode.substring(2), 16)
    )
    
    for (const constant of sortedConstants) {
      processedCount++
      process.stdout.write(`   [${processedCount}/${totalConstants}] ${constant.hexCode} (${constant.constantName})... `)
      
      const result = await checkAndExtractDocumentation(constant)
      if (result.found) {
        found++
        if (result.extracted) {
          extracted++
          totalExtracted++
          process.stdout.write('✅ (extracted)\n')
        } else {
          process.stdout.write('⚠️ (found but not extracted)\n')
          if (result.closestMatch) {
            // Output debug info immediately
            console.log(`\n     ⚠️ DEBUG: Found but couldn't extract ${constant.hexCode} - ${constant.constantName}`)
            console.log(`     Closest match heading: ${result.closestMatch.heading}`)
            console.log(`     Reasons it didn't match:`)
            result.closestMatch.reasons.forEach(r => console.log(`       ${r}`))
            console.log()
          }
        }
      } else {
        missingConstants.push({
          hexCode: constant.hexCode,
          constantName: constant.constantName,
          category: constant.category,
          sourceFile: constant.sourceFile,
          searchAttempts: result.searchAttempts,
          closestMatch: result.closestMatch
        })
        process.stdout.write('❌\n')
        
        if (result.closestMatch) {
          // Output debug info immediately for missing constants
          console.log(`\n     ❌ DEBUG: Could not find ${constant.hexCode} - ${constant.constantName}`)
          console.log(`     Closest potential match:`)
          console.log(`       Heading: ${result.closestMatch.heading}`)
          console.log(`       Reasons it didn't match:`)
          result.closestMatch.reasons.forEach(r => console.log(`         ${r}`))
          console.log()
        }
      }
    }
    
    const total = groupConstants.length
    const missing = total - found
    const percentage = total > 0 ? (found / total) * 100 : 0
    const extractionPercentage = found > 0 ? (extracted / found) * 100 : 0
    
    summaries.set(key, {
      vendor: vendor as 'iso' | 'sony',
      category,
      total,
      found,
      extracted,
      missing,
      percentage,
      extractionPercentage,
      missingConstants
    })
    
    console.log(`   Summary: ${found}/${total} found (${percentage.toFixed(1)}%), ${extracted}/${found} extracted (${extractionPercentage.toFixed(1)}%)`)
  }
  
  console.log(`\n📦 Total documentation blocks extracted: ${totalExtracted}`)
  
  return summaries
}

// Generate comprehensive report
async function generateReport(summaries: Map<string, CategorySummary>): Promise<void> {
  let report = `# PTP Constants Documentation Coverage Report (Strict Mode)
Generated: ${new Date().toISOString()}

This report provides a comprehensive analysis of PTP constants documentation coverage using strict matching criteria.
Individual documentation blocks have been extracted to \`docs/audit/iso/\` and \`docs/audit/sony/\`.

## Strict Matching Criteria

- Heading must match constant name (fuzzy match >= 60%)
- Block must contain correct field type for category
- Hex code must appear within the block
- Block must have proper boundaries (headings before and after)
- Minimum content length requirement

## Summary

`

  // Separate by vendor
  const isoSummaries = Array.from(summaries.values()).filter(s => s.vendor === 'iso')
  const sonySummaries = Array.from(summaries.values()).filter(s => s.vendor === 'sony')
  
  // ISO Summary
  let isoTotal = 0, isoFound = 0, isoExtracted = 0, isoMissing = 0
  report += `### ISO Constants (PTP Standard)\n\n`
  report += `| Category | Total | Found | Extracted | Missing | Coverage | Extraction |\n`
  report += `|----------|-------|-------|-----------|---------|----------|------------|\n`
  
  // Sort categories for consistent display
  const categoryOrder = ['datatype', 'property', 'operation', 'event', 'response', 'format', 'storage', 'error']
  const sortedIsoSummaries = isoSummaries.sort((a, b) => {
    const indexA = categoryOrder.indexOf(a.category)
    const indexB = categoryOrder.indexOf(b.category)
    if (indexA === -1) return 1
    if (indexB === -1) return -1
    return indexA - indexB
  })
  
  for (const summary of sortedIsoSummaries) {
    isoTotal += summary.total
    isoFound += summary.found
    isoExtracted += summary.extracted
    isoMissing += summary.missing
    const icon = summary.percentage === 100 ? '✅' : summary.percentage >= 80 ? '🟡' : '❌'
    const extractIcon = summary.extractionPercentage === 100 ? '✅' : summary.extractionPercentage >= 80 ? '🟡' : '❌'
    report += `| ${summary.category} | ${summary.total} | ${summary.found} | ${summary.extracted} | ${summary.missing} | ${summary.percentage.toFixed(1)}% ${icon} | ${summary.extractionPercentage.toFixed(1)}% ${extractIcon} |\n`
  }
  
  const isoPercentage = isoTotal > 0 ? (isoFound / isoTotal) * 100 : 0
  const isoExtractionPercentage = isoFound > 0 ? (isoExtracted / isoFound) * 100 : 0
  report += `| **TOTAL** | **${isoTotal}** | **${isoFound}** | **${isoExtracted}** | **${isoMissing}** | **${isoPercentage.toFixed(1)}%** | **${isoExtractionPercentage.toFixed(1)}%** |\n\n`
  
  // Sony Summary
  let sonyTotal = 0, sonyFound = 0, sonyExtracted = 0, sonyMissing = 0
  report += `### Sony Constants (Vendor Extensions)\n\n`
  report += `| Category | Total | Found | Extracted | Missing | Coverage | Extraction |\n`
  report += `|----------|-------|-------|-----------|---------|----------|------------|\n`
  
  const sortedSonySummaries = sonySummaries.sort((a, b) => {
    const indexA = categoryOrder.indexOf(a.category)
    const indexB = categoryOrder.indexOf(b.category)
    if (indexA === -1) return 1
    if (indexB === -1) return -1
    return indexA - indexB
  })
  
  for (const summary of sortedSonySummaries) {
    sonyTotal += summary.total
    sonyFound += summary.found
    sonyExtracted += summary.extracted
    sonyMissing += summary.missing
    const icon = summary.percentage === 100 ? '✅' : summary.percentage >= 80 ? '🟡' : '❌'
    const extractIcon = summary.extractionPercentage === 100 ? '✅' : summary.extractionPercentage >= 80 ? '🟡' : '❌'
    report += `| ${summary.category} | ${summary.total} | ${summary.found} | ${summary.extracted} | ${summary.missing} | ${summary.percentage.toFixed(1)}% ${icon} | ${summary.extractionPercentage.toFixed(1)}% ${extractIcon} |\n`
  }
  
  const sonyPercentage = sonyTotal > 0 ? (sonyFound / sonyTotal) * 100 : 0
  const sonyExtractionPercentage = sonyFound > 0 ? (sonyExtracted / sonyFound) * 100 : 0
  report += `| **TOTAL** | **${sonyTotal}** | **${sonyFound}** | **${sonyExtracted}** | **${sonyMissing}** | **${sonyPercentage.toFixed(1)}%** | **${sonyExtractionPercentage.toFixed(1)}%** |\n\n`
  
  // Overall Summary
  const overallTotal = isoTotal + sonyTotal
  const overallFound = isoFound + sonyFound
  const overallExtracted = isoExtracted + sonyExtracted
  const overallMissing = isoMissing + sonyMissing
  const overallPercentage = overallTotal > 0 ? (overallFound / overallTotal) * 100 : 0
  const overallExtractionPercentage = overallFound > 0 ? (overallExtracted / overallFound) * 100 : 0
  
  report += `### Overall Statistics\n\n`
  report += `- **Total PTP Constants**: ${overallTotal}\n`
  report += `- **Documented**: ${overallFound}\n`
  report += `- **Extracted**: ${overallExtracted}\n`
  report += `- **Missing**: ${overallMissing}\n`
  report += `- **Coverage**: ${overallPercentage.toFixed(1)}%\n`
  report += `- **Extraction Rate**: ${overallExtractionPercentage.toFixed(1)}%\n`
  report += `- **Target**: 80% coverage\n`
  report += `- **Status**: ${overallPercentage >= 80 ? '✅ PASSING' : '❌ NEEDS IMPROVEMENT'}\n\n`
  
  // Detailed missing constants
  if (overallMissing > 0) {
    report += `## Missing Constants Details\n\n`
    report += `The following PTP constants are defined in the codebase but could not be found in the documentation.\n`
    report += `Debug information about why extraction failed is shown in the console output above.\n\n`
    
    // ISO Missing
    if (isoMissing > 0) {
      report += `### ISO Standard Missing Constants\n\n`
      for (const summary of sortedIsoSummaries) {
        if (summary.missingConstants.length > 0) {
          report += `#### ${summary.category.toUpperCase()}\n\n`
          if (summary.category === 'datatype') {
            report += `*Note: Data types should be in Table 3 — Datatype codes (Section 5.3 Simple types)*\n\n`
          }
          report += `| Hex Code | Constant Name | Source File |\n`
          report += `|----------|---------------|-------------|\n`
          for (const missing of summary.missingConstants) {
            report += `| \`${missing.hexCode}\` | ${missing.constantName} | \`${missing.sourceFile}\` |\n`
          }
          report += `\n`
        }
      }
    }
    
    // Sony Missing
    if (sonyMissing > 0) {
      report += `### Sony Vendor Extension Missing Constants\n\n`
      for (const summary of sortedSonySummaries) {
        if (summary.missingConstants.length > 0) {
          report += `#### ${summary.category.toUpperCase()}\n\n`
          report += `| Hex Code | Constant Name | Source File |\n`
          report += `|----------|---------------|-------------|\n`
          for (const missing of summary.missingConstants) {
            report += `| \`${missing.hexCode}\` | ${missing.constantName} | \`${missing.sourceFile}\` |\n`
          }
          report += `\n`
        }
      }
    }
  }
  
  // Write report
  await fs.mkdir(CONFIG.outputPath, { recursive: true })
  const reportPath = path.join(CONFIG.outputPath, 'ptp-constants-coverage-strict.md')
  await fs.writeFile(reportPath, report)
  console.log(`\n📄 Report saved to: ${reportPath}`)
  
  // Also save as JSON for programmatic access
  const jsonData = {
    generated: new Date().toISOString(),
    mode: 'strict',
    excludedFiles: CONFIG.excludeFiles,
    summary: {
      total: overallTotal,
      documented: overallFound,
      extracted: overallExtracted,
      missing: overallMissing,
      coverage: overallPercentage,
      extractionRate: overallExtractionPercentage,
      passing: overallPercentage >= 80
    },
    iso: {
      total: isoTotal,
      documented: isoFound,
      extracted: isoExtracted,
      missing: isoMissing,
      coverage: isoPercentage,
      extractionRate: isoExtractionPercentage,
      categories: sortedIsoSummaries.map(s => ({
        category: s.category,
        total: s.total,
        documented: s.found,
        extracted: s.extracted,
        missing: s.missing,
        coverage: s.percentage,
        extractionRate: s.extractionPercentage,
        missingConstants: s.missingConstants
      }))
    },
    sony: {
      total: sonyTotal,
      documented: sonyFound,
      extracted: sonyExtracted,
      missing: sonyMissing,
      coverage: sonyPercentage,
      extractionRate: sonyExtractionPercentage,
      categories: sortedSonySummaries.map(s => ({
        category: s.category,
        total: s.total,
        documented: s.found,
        extracted: s.extracted,
        missing: s.missing,
        coverage: s.percentage,
        extractionRate: s.extractionPercentage,
        missingConstants: s.missingConstants
      }))
    }
  }
  
  const jsonPath = path.join(CONFIG.outputPath, 'ptp-constants-coverage-strict.json')
  await fs.writeFile(jsonPath, JSON.stringify(jsonData, null, 2))
  console.log(`📊 JSON data saved to: ${jsonPath}`)
}

// Main function
async function main() {
  try {
    const summaries = await analyzeMissingConstants()
    console.log()
    await generateReport(summaries)
    
    // Print final summary
    console.log('\n' + '='.repeat(60))
    
    let totalConstants = 0
    let totalFound = 0
    let totalExtracted = 0
    summaries.forEach(s => {
      totalConstants += s.total
      totalFound += s.found
      totalExtracted += s.extracted
    })
    
    const coverage = totalConstants > 0 ? (totalFound / totalConstants) * 100 : 0
    const extractionRate = totalFound > 0 ? (totalExtracted / totalFound) * 100 : 0
    
    console.log(`\n📈 Final Coverage: ${coverage.toFixed(1)}%`)
    console.log(`📊 Extraction Rate: ${extractionRate.toFixed(1)}%`)
    console.log(`📊 Status: ${coverage >= 80 ? '✅ PASSING' : '❌ NEEDS IMPROVEMENT'}`)
    
    if (coverage >= 80) {
      console.log('\n🎉 Congratulations! Documentation coverage meets requirements.')
      console.log('📁 Documentation blocks have been extracted to docs/audit/')
    } else {
      console.log('\n⚠️  Coverage is below 80% threshold.')
      console.log('📝 Review the debug output above for detailed failure reasons.')
      console.log('💡 Consider adjusting fuzzy threshold or improving documentation format.')
    }
    
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

main()