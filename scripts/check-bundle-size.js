#!/usr/bin/env node

/**
 * Bundle size budget checker for Next.js App Router
 * Checks that bundle sizes don't exceed defined budgets
 */

const fs = require('fs')
const path = require('path')

// Bundle size budgets in KB (uncompressed)
const BUNDLE_BUDGETS = {
  // Main chunks (App Router)
  'chunks/main.js': 200, // Main app bundle
  'chunks/vendor.js': 900, // Vendor libraries (D3, Radix UI, React Query, etc. are heavy)
  'chunks/webpack.js': 60, // Webpack runtime
  
  // App Router pages
  'app/(studio)/page.js': 300, // Studio page
  'app/(marketing)/landing/page.js': 150, // Landing page
  
  // Total first load (main + vendor + webpack)
  'first-load': 1000, // Total initial bundle size (realistic for heavy dependencies like D3)
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
  
  // Read static chunks directory
  const staticDir = path.join(BUILD_DIR, 'static', 'chunks')
  if (fs.existsSync(staticDir)) {
    // Check main chunks
    const mainChunks = ['main', 'vendor', 'webpack', 'polyfills']
    mainChunks.forEach((chunkName) => {
      const chunkFiles = fs.readdirSync(staticDir).filter((file) => 
        file.startsWith(`${chunkName}-`) && file.endsWith('.js')
      )
      
      chunkFiles.forEach((file) => {
        const filePath = path.join(staticDir, file)
        const size = getFileSize(filePath)
        if (size !== null) {
          const key = `chunks/${chunkName}.js`
          if (!files[key]) files[key] = 0
          files[key] += size
        }
      })
    })
    
    // Check App Router pages
    const appDir = path.join(staticDir, 'app')
    if (fs.existsSync(appDir)) {
      // Studio page
      const studioPageFiles = fs.readdirSync(appDir, { recursive: true }).filter((file) =>
        file.includes('(studio)') && file.includes('page-') && file.endsWith('.js')
      )
      studioPageFiles.forEach((file) => {
        const filePath = path.join(appDir, file)
        const size = getFileSize(filePath)
        if (size !== null) {
          const key = 'app/(studio)/page.js'
          if (!files[key]) files[key] = 0
          files[key] += size
        }
      })
      
      // Landing page
      const landingPageFiles = fs.readdirSync(appDir, { recursive: true }).filter((file) =>
        file.includes('(marketing)') && file.includes('landing') && file.includes('page-') && file.endsWith('.js')
      )
      landingPageFiles.forEach((file) => {
        const filePath = path.join(appDir, file)
        const size = getFileSize(filePath)
        if (size !== null) {
          const key = 'app/(marketing)/landing/page.js'
          if (!files[key]) files[key] = 0
          files[key] += size
        }
      })
    }
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
      // Calculate total first load (main + vendor + webpack)
      const firstLoadFiles = [
        'chunks/main.js',
        'chunks/vendor.js',
        'chunks/webpack.js',
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
