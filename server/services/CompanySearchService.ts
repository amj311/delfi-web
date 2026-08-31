/**
 * Company search service - Utility for finding company websites
 */
import axios from 'axios';
import { PromiseQueue } from 'delfi-core/utils/PromiseQueue';
import { norm, similarityScore } from 'delfi-core/utils/textSimilarity';

interface CompanySearchResult {
	url: string;
	origin: string;
	hostname: string;
	score: number;
	title: string;
	snippet: string;
}

const RATE_LIMIT_SECOND = 1000;
const LangSearchQueue = new PromiseQueue({ minInterval: RATE_LIMIT_SECOND + 100 });

export default class CompanySearchService {
	/**
	 * Searches for a company's website using the LangSearch API
	 * @param identifier The best identifier we have for the company name, usually parsed from a transaction
	 * @param numResults Number of search results to analyze
	 * @returns An array of scored search results, sorted by relevance
	 */
	public static async doCompanySearch(identifier: string, locationSearch: string = '', numResults = 5): Promise<CompanySearchResult | null> {
		try {
			const apiKey = process.env.LANGSEARCH_API_KEY;

			if (!apiKey) {
				console.log('❌ LANGSEARCH_API_KEY not found in environment variables');
				return null;
			}

			console.log(`🔍 Searching for company: ${identifier}, ${locationSearch}`);

			/**
			 * Do TOW Searches! Some small local businesses do better with location info,
			 * while others do better with just the company identifier.
			 * Search both, and then take the best out of all of them.
			 */
			// Make search request to LangSearch API
			const searchStrings = [
				`Please find the website for this company: ${identifier}`,
				`Please find the website for this company: ${identifier}, ${locationSearch}`
			];
			// const response = await axios.post('https://api.langsearch.com/v1/web-search', {
			// 	query: `Please find the website for this company: ${identifier}`,
			// 	num_results: numResults
			// }, {
			// 	headers: {
			// 		'Content-Type': 'application/json',
			// 		'Authorization': `Bearer ${apiKey}`
			// 	}
			// });

			const allResults = await Promise.all(searchStrings.map(async (searchStr, i) => {
				return await LangSearchQueue.add(async () => {
					console.log("doing lang search")
					return axios.post('https://api.langsearch.com/v1/web-search', {
						query: searchStr,
						num_results: numResults
					}, {
						headers: {
							'Content-Type': 'application/json',
							'Authorization': `Bearer ${apiKey}`
						}
					});
				})
			}));

			// Extract and score the search results
			const webPages = allResults.flatMap(response => response.data.data.webPages.value.filter((page: any) => {;
				// skip known problematic search results like yelp, restaurantji, etc
				const badSites = ['yelp.com', 'restaurantji.com', 'tripadvisor.com', 'facebook.com', 'loc8nearme.com'];
				return !badSites.some(badSite => page.url.includes(badSite));
			}));

			const scoredResults: CompanySearchResult[] = webPages.map(page => {
				const url = page.url;
				const origin = new URL(url).origin;
				const hostname = new URL(url).hostname;

				// Calculate relevance score between company name and hostname
				const score = CompanySearchService.calculateRelevanceScore(identifier, hostname);

				const result: CompanySearchResult = {
					url,
					origin,
					hostname,
					score,
					title: page.name,
					snippet: page.snippet
				};
				return result;
			});

			console.log('Company search results:', scoredResults);

			// Sort results by score (highest first)
			return scoredResults.sort((a, b) => b.score - a.score)[0];

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
	 * Calculate a weighted relevance score between a company name and a URL
	 * Takes into account multiple factors including:
	 * - Exact match of company name in hostname
	 * - Partial match with domain segments
	 * - Similarity between company name and domain parts
	 * 
	 * @param companySearch The company name to search for
	 * @param hostname The hostname to evaluate against the company name
	 * @returns A score from 0-100 where higher means more relevant
	 */
	private static calculateRelevanceScore(companySearch: string, hostname: string): number {
		// Create normalized versions for comparison
		const searchParts = companySearch.toLowerCase().split(/\s+/);
		const normalizedCompany = companySearch.toLowerCase().replace(/[^a-z0-9]/g, '');
		// don't consider any subdomains, we only want a confident match with the main domain
		// BUG! This will not work for hostnames with suffixes like .co.uk or .com.au
		const rootDomain = hostname.split('.').slice(-2).join('.'); // e.g. "example.com"
		const normalizedDomain = rootDomain.toLowerCase().replace(/[^a-z0-9.]/g, '');
		const normalizedDomainWithoutTLD = normalizedDomain
			.replace(/^www\./, '')
			.replace(/\.(com|org|net|io|co|gov|edu)$/, '');

		// Base score components
		let score = similarityScore(normalizedCompany, normalizedDomainWithoutTLD);

		// 1. Exact match between company name and domain (highest weight)
		if (normalizedDomainWithoutTLD === normalizedCompany) {
			score += 60; // High score for exact match
		}

		// 2. Check if company name is contained in the domain or vice versa
		else if (normalizedDomainWithoutTLD.includes(normalizedCompany)) {
			score += 40; // Good score for domain containing company name
		}
		else if (normalizedCompany.includes(normalizedDomainWithoutTLD)) {
			score += 35; // Slightly lower but still good
		}

		// add points for each full word match in the domain
		for (const part of searchParts) {
			if (normalizedDomainWithoutTLD.includes(part)) {
				score += 5; // Add points for each full word match
			}
		}

		// Return capped score between 0-100
		return Math.min(100, Math.max(0, score));
	}

	public static async extractWebsiteData(origin: string): Promise<{ nameCandidates: string[], logo: string | null }> {
		let html;
		const url = origin.startsWith('http') ? origin : `https://${origin}`;
		try {
			const { data } = await axios.get(url, { timeout: 5000 });
			html = data as string;
		}
		catch (error) {
			console.error(`Could not fetch website HTML for ${origin}`);
			return { nameCandidates: [], logo: null };
		}
		const namesFromHtml = CompanySearchService.extractNamesFromHtml(html);
		let logoPath = CompanySearchService.extractLogoFromHtml(html);
		if (logoPath && !logoPath.startsWith('http')) {
			logoPath = new URL(logoPath, url).href; // Make absolute URL
		}

		return {
			nameCandidates: namesFromHtml,
			logo: logoPath
		};
	}

	public static extractLogoFromHtml(html: string): string | null {
		// Icon link rels
		type IconMatch = {
			source: string, // Source of the icon (e.g., og:image)
			path: string,
			size?: number,
		}
		const iconUrls: Array<IconMatch> = [];

		const iconLinkRels = ['icon', 'shortcut icon', 'apple-touch-icon', 'apple-touch-icon-precomposed'];			
		iconLinkRels.forEach(rel => {
			const regex = new RegExp(`<link[^>]+rel=["']${rel}["'][^>]+>`, 'gi');
			let match;
			while ((match = regex.exec(html)) !== null) {
				const fullLink = match[0];
				const sizeMatch = fullLink.match(/sizes=["'](\d+x\d+)["']/);
				const size = sizeMatch ? parseInt(sizeMatch[1].split('x')[0], 10) : undefined; // Get width if available
				const iconPath = fullLink.match(/href=["']([^"']+)["']/)?.[1];
				if (!iconPath) continue; // Skip if no href found
				// If path does not start with http, prepend the base URL.
				iconUrls.push({
					source: rel,
					// path: iconPath.startsWith('http') ? iconPath : new URL(iconPath, mostLikelyWebsite.url).href,
					path: iconPath,
					size: size,
				});
			}
		});
		const metaIconProperties = ['og:image'];
		metaIconProperties.forEach(property => {
			const regex = new RegExp(`<meta[^>]{1,100}property=["']${property}["'][^>]{1,100}>`, 'gi');
			let match;
			while ((match = regex.exec(html)) !== null) {
				const fullMeta = match[0];
				const iconPath = fullMeta.match(/content=["']([^"']{1,100})["']/)?.[1];
				if (!iconPath) continue; // Skip if no content found
				iconUrls.push({
					source: property,
					path: iconPath,
				});
			}
		});

		iconUrls.sort((a, b) => {
			// Apple icons come first
			if (a.source.includes('apple') && !b.source.includes('apple')) {
				return -1;
			}
			if (!a.source.includes('apple') && b.source.includes('apple')) {
				return 1;
			}

			// If it has no size, prefer the other
			if (!a.size && b.size) {
				return 1; 
			}
			if (!b.size && a.size) {
				return -1;
			}
			
			if (a.size && b.size) {
				return b.size - a.size; // Sort by size descending
			}
			return 0; // If sizes are not available, keep original order
		});

		return iconUrls.length > 0 ? iconUrls[0].path : null;
	}

	/**
	 * Decode HTML entities in a string
	 * @param str String containing HTML entities
	 * @returns Decoded string with normal characters
	 */
	private static decodeHtmlEntities(str: string): string {
		const htmlEntities: { [key: string]: string } = {
			'&amp;': '&',
			'&lt;': '<',
			'&gt;': '>',
			'&quot;': '"',
			'&apos;': "'",
			'&#39;': "'",
			'&#8211;': '–', // en dash
			'&#8212;': '—', // em dash
			'&#8216;': '\u2018', // left single quotation mark
			'&#8217;': '\u2019', // right single quotation mark
			'&#8220;': '\u201C', // left double quotation mark
			'&#8221;': '\u201D', // right double quotation mark
			'&#8230;': '…', // horizontal ellipsis
			'&nbsp;': ' ',
			'&copy;': '©',
			'&reg;': '®',
			'&trade;': '™'
		};

		// First handle named entities
		let decoded = str;
		for (const [entity, char] of Object.entries(htmlEntities)) {
			decoded = decoded.replace(new RegExp(entity, 'g'), char);
		}

		// Then handle numeric entities like &#123; and &#x1A;
		decoded = decoded.replace(/&#(\d+);/g, (match, num) => {
			return String.fromCharCode(parseInt(num, 10));
		});
		decoded = decoded.replace(/&#x([0-9A-Fa-f]+);/g, (match, hex) => {
			return String.fromCharCode(parseInt(hex, 16));
		});

		return decoded;
	}

	public static extractNamesFromHtml(html: string): Array<string> {
		// Extract name from og:site_name
		const metaNameMatch = html.match(/<meta[^>]{1,100}property=["']og:site_name["'][^>]{1,100}>/i)?.[0].match(/content=["']([^"']{1,100})["']/)?.[1];
		const pagTitle = html.match(/<title>(.{1,100}?)<\/title>/i)?.[1];

		// Split title or site_name into parts and decode HTML entities
		return [metaNameMatch, pagTitle].flatMap(str => {
			const parts: Array<string> = [];
			if (str) {
				const isStr = str.toString();
				// Decode HTML entities before splitting
				const decodedStr = CompanySearchService.decodeHtmlEntities(isStr);
				parts.push(...decodedStr.split(' - ').map(p => p.split(' | ')).flat().map(p => p.split(', ')).flat().map(p => p.trim()));
			}
			return parts;
		})
	}

	/**
	 * Candidates should already be cleaned from any html codes or other unwanted characters
	 * @param candidates 
	 * @param knownIdentifier 
	 * @returns 
	 */
	public static chooseBestName(candidates: Array<string>, knownIdentifier: string): string | null {
		// Split title or site_name into parts and decode HTML entities
		const nameCandidates = candidates.map(part => part.trim()).filter(Boolean).map(part => ({
			part,
			score: similarityScore(norm(part), norm(knownIdentifier)),
		})).sort((a, b) => b.score - a.score);

		const best = nameCandidates[0];
		if (!best) return null;

		// Clean up the best name a little bit

		return nameCandidates.length > 0 ? this.prettifyName(nameCandidates[0].part) : null;
	}

	private static prettifyName(name: string): string {
		// If either the entire name is uppercase or the entire name is lowercase, then only capitalize each word.
		// Otherwise, maybe it's already the way it should be.
		if (name === name.toUpperCase() || name === name.toLowerCase()) {
			return name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
		}
		return name;
	}

}