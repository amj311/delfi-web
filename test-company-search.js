#!/usr/bin/env node
/**
 * Company Website Finder Test Script
 * 
 * This script demonstrates how to use the company website finder functionality
 * to score and find the most relevant website for a company.
 * 
 * Usage:
 *   node test-company-search.js "Company Name"
 * 
 * Example:
 *   node test-company-search.js "Apple Inc"
 */

require('dotenv').config();
const axios = require('axios');

// Default test company if none provided
const testCompany = process.argv[2] || 'Cafe Rio';

async function testCompanySearch(companyName) {
  try {
    console.log(`🔍 Searching for company website: "${companyName}"...`);
    
    // This assumes the server is running locally
    const response = await axios.post('http://localhost:5000/search/company-website', {
      companyName,
      numResults: 8 // Get more results for better comparison
    });
    
    if (!response.data.success) {
      console.error('❌ Search failed:', response.data.error);
      return;
    }
    
    const { results, mostLikelyWebsite } = response.data;
    
    // Print the results
    console.log('\n📊 Results ranked by relevance:');
    results.forEach((result, index) => {
      console.log(`\n[${index + 1}] Score: ${result.score}/100 - ${result.hostname}`);
      console.log(`    URL: ${result.url}`);
      console.log(`    Title: ${result.title}`);
      console.log(`    Snippet: ${result.snippet ? result.snippet.substring(0, 100) + '...' : '[No snippet]'}`);
    });
    
    // Print the most likely company website
    console.log('\n🏆 Most likely company website:');
    console.log(`    Domain: ${mostLikelyWebsite.domain}`);
    console.log(`    Score: ${mostLikelyWebsite.score}/100`);
    
    // Test the snippet comparison directly
    console.log('\n🔬 Testing direct snippet comparison with URLs:');
    const urls = results.map(r => r.url);
    
    const comparisonResponse = await axios.post('http://localhost:5000/search/compare-snippet', {
      snippet: companyName,
      urls
    });
    
    if (comparisonResponse.data.success) {
      console.log('\n📊 Direct comparison results:');
      comparisonResponse.data.results.slice(0, 3).forEach((result, index) => {
        console.log(`[${index + 1}] Score: ${result.score}/100 - ${result.hostname}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error running test:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Error message:`, error.response.data);
    } else {
      console.error(error.message || error);
    }
  }
}

// Run the test
testCompanySearch(testCompany);
