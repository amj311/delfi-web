/**
 * Utility functions for comparing text similarity
 */

/**
 * Calculate Levenshtein distance between two strings
 * The smaller the distance, the more similar the strings
 */
export function levenshteinDistance(str1: string, str2: string): number {
	const m = str1.length;
	const n = str2.length;

	// Create a matrix of size (m+1) x (n+1)
	const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

	// Initialize first row and column
	for (let i = 0; i <= m; i++) dp[i][0] = i;
	for (let j = 0; j <= n; j++) dp[0][j] = j;

	// Fill the matrix
	for (let i = 1; i <= m; i++) {
		for (let j = 1; j <= n; j++) {
			if (str1[i - 1] === str2[j - 1]) {
				dp[i][j] = dp[i - 1][j - 1]; // No operation needed
			} else {
				dp[i][j] = Math.min(
					dp[i - 1][j] + 1,     // deletion
					dp[i][j - 1] + 1,     // insertion
					dp[i - 1][j - 1] + 1  // substitution
				);
			}
		}
	}

	// Return the distance
	return dp[m][n];
}

/**
 * Calculate similarity score (0-100) between two strings
 * Higher score means more similar strings
 */
export function similarityScore(str1: string, str2: string): number {
	// Normalize both strings for comparison
	const normalizedStr1 = str1.toLowerCase().trim();
	const normalizedStr2 = str2.toLowerCase().trim();

	// If either string is empty, return 0
	if (!normalizedStr1 || !normalizedStr2) return 0;

	// Get Levenshtein distance
	const distance = levenshteinDistance(normalizedStr1, normalizedStr2);

	// Calculate max possible distance
	const maxLength = Math.max(normalizedStr1.length, normalizedStr2.length);

	// Calculate similarity as percentage (inverse of distance/maxLength)
	// The closer the distance is to 0, the more similar the strings
	const similarityPercentage = ((maxLength - distance) / maxLength) * 100;

	return Math.round(similarityPercentage);
}

export function norm(str: string): string {
	// Normalize string by removing non-alphanumeric characters and converting to lowercase
	return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Calculate a weighted relevance score between a company name and a URL
 * Takes into account multiple factors including:
 * - Exact match of company name in domain
 * - Partial match with domain segments
 * - Similarity between company name and domain parts
 * 
 * @param companySearch The company name to search for
 * @param url The URL to evaluate against the company name
 * @returns A score from 0-100 where higher means more relevant
 */
export function calculateRelevanceScore(companySearch: string, domain: string): number {
	// Create normalized versions for comparison
	const searchParts = companySearch.toLowerCase().split(/\s+/);
	const normalizedCompany = companySearch.toLowerCase().replace(/[^a-z0-9]/g, '');
	// don't consider any subdomains, we only want a confident match with the main domain
	const mainDomain = domain.split('.').slice(-2).join('.'); // e.g. "example.com"
	const normalizedDomain = mainDomain.toLowerCase().replace(/[^a-z0-9.]/g, '');
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
