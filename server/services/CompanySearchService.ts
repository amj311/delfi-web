/**
 * Company search service - Utility for finding company websites
 */
import axios from 'axios';
import { calculateRelevanceScore } from '../utils/textSimilarity';

interface CompanySearchResult {
  url: string;
  domain: string;
  hostname: string;
  score: number;
  title: string;
  snippet: string;
}

/**
 * Searches for a company's website using the LangSearch API
 * @param companyName The name of the company to search for
 * @param numResults Number of search results to analyze
 * @returns An array of scored search results, sorted by relevance
 */
export async function findCompanyWebsite(companyName: string, numResults = 5): Promise<CompanySearchResult[] | null> {
  try {
    const apiKey = process.env.LANGSEARCH_API_KEY;
    
    if (!apiKey) {
      console.log('❌ LANGSEARCH_API_KEY not found in environment variables');
      return null;
    }
    
    console.log(`🔍 Searching for company website: "${companyName}"...`);
    
    // Make search request to LangSearch API
    const response = await axios.post('https://api.langsearch.com/v1/web-search', {
      query: `Please find the website for this company: ${companyName}`,
      num_results: numResults
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    // Extract and score the search results
    const webPages = response.data.data.webPages.value;
    const scoredResults = webPages.map(page => {
      const url = page.url;
      const domain = new URL(url).origin;
      const hostname = new URL(url).hostname;

      // Calculate relevance score between company name and URL
      const score = calculateRelevanceScore(companyName, hostname);
      
      return {
        url,
        domain,
        hostname,
        score,
        title: page.name,
        snippet: page.snippet
      };
    });
    
    // Sort results by score (highest first)
    return scoredResults.sort((a, b) => b.score - a.score);
    
  } catch (error) {
    console.error('❌ Company search failed:');
    if (axios.isAxiosError(error)) {
      console.error(`Status: ${error.response?.status}`);
      console.error(`Error message: ${error.message}`);
    } else {
      console.error(error);
    }
    return null;
  }
}

/**
 * Prints the search results to the console in a readable format
 */
export function printCompanySearchResults(results: CompanySearchResult[]): void {
  console.log('📊 Ranked Results:');
  
  results.forEach((result, index) => {
    console.log(`\n[${index + 1}] Score: ${result.score}/100 - ${result.hostname}`);
    console.log(`    URL: ${result.url}`);
    console.log(`    Title: ${result.title}`);
    console.log(`    Snippet: ${result.snippet.substring(0, 100)}...`);
  });
  
  // Identify the most likely company website
  const mostLikelyCompanyWebsite = results[0];
  console.log('\n🏆 Most likely company website:');
  console.log(`    Domain: ${mostLikelyCompanyWebsite.domain}`);
  console.log(`    Score: ${mostLikelyCompanyWebsite.score}/100`);
}

/**
 * Get the most likely company website domain from search results
 */
export function getMostLikelyCompanyDomain(results: CompanySearchResult[]): string | null {
  if (!results || results.length === 0) {
    return null;
  }
  return results[0].domain;
}
