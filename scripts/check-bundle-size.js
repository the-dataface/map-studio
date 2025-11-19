#!/usr/bin/env node

/**
 * Bundle size budget checker
 * Checks that bundle sizes don't exceed defined budgets
 */

const fs = require('fs')
const path = require('path')

// Bundle size budgets in KB (uncompressed)
const BUNDLE_BUDGETS = {
  // First load JS bundles
  'pages/_app.js': 200, // Main app bundle
  'pages/index.js': 300, // Studio page
  'pages/landing.js': 150, // Landing page
  
  // Chunk bundles
  'chunks/d3.js': 500, // D3 library
  'chunks/vendor.js': 300, // Vendor libraries
  'chunks/react-query.js': 100, // React Query
  'chunks/radix-ui.js': 200, // Radix UI components
  
  // CSS bundles
  'pages/_app.css': 50,
  
  // Total first load (all initial JS + CSS)
  'first-load': 500, // Total initial bundle size
}

const BUILD_DIR = path.join(process.cwd(), '.next')

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath)
    return stats.size
  } catch (error) {
    return null
  }
}

function findBuildFiles() {
  const files = {}
  
  // Read the build manifest to find all chunks
  const manifestPath = path.join(BUILD_DIR, 'build-manifest.json')
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
    
    // Process pages
    Object.entries(manifest.pages).forEach(([page, chunks]) => {
      chunks.forEach((chunk) => {
        const chunkPath = path.join(BUILD_DIR, 'static', chunk)
        const size = getFileSize(chunkPath)
        if (size !== null) {
          const key = `pages/${page === '/' ? 'index' : page.replace(/^\//, '')}.js`
          if (!files[key]) files[key] = 0
          files[key] += size
        }
      })
    })
  }
  
  // Read static chunks directory
  const staticDir = path.join(BUILD_DIR, 'static', 'chunks')
  if (fs.existsSync(staticDir)) {
    const entries = fs.readdirSync(staticDir, { withFileTypes: true })
    entries.forEach((entry) => {
      if (entry.isFile() && entry.name.endsWith('.js')) {
        const filePath = path.join(staticDir, entry.name)
        const size = getFileSize(filePath)
        if (size !== null) {
          // Try to match chunk names
          if (entry.name.includes('d3')) {
            if (!files['chunks/d3.js']) files['chunks/d3.js'] = 0
            files['chunks/d3.js'] += size
          } else if (entry.name.includes('react-query')) {
            if (!files['chunks/react-query.js']) files['chunks/react-query.js'] = 0
            files['chunks/react-query.js'] += size
          } else if (entry.name.includes('radix')) {
            if (!files['chunks/radix-ui.js']) files['chunks/radix-ui.js'] = 0
            files['chunks/radix-ui.js'] += size
          } else {
            if (!files['chunks/vendor.js']) files['chunks/vendor.js'] = 0
            files['chunks/vendor.js'] += size
          }
        }
      }
    })
  }
  
  return files
}

function checkBundleSizes() {
  console.log('🔍 Checking bundle sizes...\n')
  
  if (!fs.existsSync(BUILD_DIR)) {
    console.error('❌ Build directory not found. Please run "pnpm build" first.')
    process.exit(1)
  }
  
  const files = findBuildFiles()
  let hasErrors = false
  let totalFirstLoad = 0
  
  // Check each budget
  Object.entries(BUNDLE_BUDGETS).forEach(([budgetKey, budgetKB]) => {
    if (budgetKey === 'first-load') {
      // Calculate total first load
      const firstLoadFiles = [
        'pages/_app.js',
        'pages/index.js',
        'chunks/vendor.js',
        'chunks/d3.js',
        'chunks/react-query.js',
        'chunks/radix-ui.js',
      ]
      
      firstLoadFiles.forEach((file) => {
        if (files[file]) {
          totalFirstLoad += files[file]
        }
      })
      
      const totalKB = totalFirstLoad / 1024
      if (totalKB > budgetKB) {
        console.error(
          `❌ First load bundle exceeds budget: ${formatSize(totalFirstLoad)} > ${budgetKB} KB (${((totalKB / budgetKB - 1) * 100).toFixed(1)}% over)`
        )
        hasErrors = true
      } else {
        console.log(`✅ First load bundle: ${formatSize(totalFirstLoad)} (budget: ${budgetKB} KB)`)
      }
    } else {
      const fileSize = files[budgetKey]
      if (fileSize !== undefined) {
        const sizeKB = fileSize / 1024
        if (sizeKB > budgetKB) {
          console.error(
            `❌ ${budgetKey} exceeds budget: ${formatSize(fileSize)} > ${budgetKB} KB (${((sizeKB / budgetKB - 1) * 100).toFixed(1)}% over)`
          )
          hasErrors = true
        } else {
          console.log(`✅ ${budgetKey}: ${formatSize(fileSize)} (budget: ${budgetKB} KB)`)
        }
      } else {
        console.log(`⚠️  ${budgetKey}: Not found in build`)
      }
    }
  })
  
  console.log('\n📊 Bundle size summary:')
  Object.entries(files).forEach(([file, size]) => {
    console.log(`   ${file}: ${formatSize(size)}`)
  })
  
  if (hasErrors) {
    console.error('\n❌ Bundle size budgets exceeded!')
    console.error('Consider:')
    console.error('  - Code splitting and lazy loading')
    console.error('  - Removing unused dependencies')
    console.error('  - Using dynamic imports for heavy components')
    process.exit(1)
  } else {
    console.log('\n✅ All bundle size budgets met!')
  }
}

checkBundleSizes()

