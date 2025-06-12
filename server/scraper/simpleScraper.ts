// Simple Playwright scraper to navigate to American First Credit Union login page
import { chromium, type Page, type ElementHandle, type BrowserContext } from 'playwright';
import type { Account, AccountDetails } from 'delfi-core/models/Account';
import { date, type DelfiDate } from 'delfi-core/utils/dateUtils';
import { type TransactionEventDetails } from 'delfi-core/models/Transaction';

// Interface for point coordinates
interface Point {
  x: number;
  y: number;
}

// Interface for page dimensions
interface PageDimensions {
  width: number;
  height: number;
}

// Helper function for generating random Bezier curve points for natural mouse movement
function generateBezierPoints(startX: number, startY: number, endX: number, endY: number, numPoints: number = 10): Point[] {
	// Create control points for the Bezier curve
	const controlPoint1X = startX + (Math.random() * 0.3 + 0.2) * (endX - startX);
	const controlPoint1Y = startY + (Math.random() * 0.5 - 0.25) * (endY - startY);
	const controlPoint2X = startX + (Math.random() * 0.3 + 0.5) * (endX - startX);
	const controlPoint2Y = startY + (Math.random() * 0.5 - 0.25) * (endY - startY);

	// Generate points along the curve
	const points: Point[] = [];
	for (let i = 0; i <= numPoints; i++) {
		const t = i / numPoints;
		// Cubic Bezier formula
		const x = Math.pow(1 - t, 3) * startX +
			3 * Math.pow(1 - t, 2) * t * controlPoint1X +
			3 * (1 - t) * Math.pow(t, 2) * controlPoint2X +
			Math.pow(t, 3) * endX;
		const y = Math.pow(1 - t, 3) * startY +
			3 * Math.pow(1 - t, 2) * t * controlPoint1Y +
			3 * (1 - t) * Math.pow(t, 2) * controlPoint2Y +
			Math.pow(t, 3) * endY;
		points.push({ x, y });
	}
	return points;
}

// Simulate natural mouse movement across the page
async function simulateNaturalMouseMovement(page: Page): Promise<void> {
	// Get page dimensions
	const dimensions = await page.evaluate<PageDimensions>(() => {
		return {
			width: document.documentElement.clientWidth,
			height: document.documentElement.clientHeight
		};
	});

	// Start position (somewhere near the top)
	const startX = dimensions.width * 0.5;
	const startY = 100;

	// Make 2-3 natural movements across the page
	const numMovements = 2 + Math.floor(Math.random() * 2);
	let currentX = startX;
	let currentY = startY;

	for (let i = 0; i < numMovements; i++) {
		// Generate random destination within page
		const destX = Math.random() * (dimensions.width * 0.8) + (dimensions.width * 0.1);
		const destY = Math.random() * (dimensions.height * 0.7) + 100;

		// Generate movement path
		const points = generateBezierPoints(currentX, currentY, destX, destY, 15);

		// Move along the path
		for (const point of points) {
			await page.mouse.move(point.x, point.y, {
				steps: 1
			});
			// Random slight pauses during movement
			if (Math.random() < 0.2) {
				await page.waitForTimeout(50 + Math.random() * 100);
			} else {
				await page.waitForTimeout(10 + Math.random() * 20);
			}
		}

		currentX = destX;
		currentY = destY;
	}
}

// Simulate natural approach to a button
async function simulateElClick(page: Page, el: ElementHandle<SVGElement | HTMLElement>): Promise<void> {
	// Get button position
	const bounds = await el.boundingBox();
	if (!bounds) return;

	// Get current mouse position or use a default
	const currentPosition = await page.evaluate<Point>(() => {
		return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
	});

	// Target is center of button with slight randomness
	const targetX = bounds.x + bounds.width / 2 + (Math.random() * 6 - 3);
	const targetY = bounds.y + bounds.height / 2 + (Math.random() * 6 - 3);

	// Generate a natural path to the button
	const points = generateBezierPoints(
		currentPosition.x,
		currentPosition.y,
		targetX,
		targetY,
		12
	);

	// Move along the path with variable speed
	for (const point of points) {
		await page.mouse.move(point.x, point.y, { steps: 1 });
		await page.waitForTimeout(10 + Math.random() * 30);
	}

	// Add a slight delay before clicking (humans don't click instantly)
	await page.waitForTimeout(300 + Math.random() * 200);
	await el.click({ delay: 50 + Math.random() * 100 }); // Variable click duration
}

// Human-like typing function
async function typeHumanLike(page: Page, element: ElementHandle<SVGElement | HTMLElement>, text: string): Promise<void> {
	// Clear the field first (if needed)
	await element.click({ clickCount: 3 }); // Triple click to select all
	await page.keyboard.press('Backspace');

	// Type each character with a random delay
	for (let i = 0; i < text.length; i++) {
		// Random delay between 100ms and 300ms
		const delay = Math.floor(Math.random() * 200) + 100;
		await page.waitForTimeout(delay);

		// Small chance (5%) to make a typo
		if (Math.random() < 0.05 && i < text.length - 1) {
			// Type a wrong character
			const wrongChar = String.fromCharCode(
				text.charCodeAt(i) + (Math.random() > 0.5 ? 1 : -1)
			);
			await element.type(wrongChar);

			// Wait a bit before correcting
			await page.waitForTimeout(300 + Math.random() * 200);

			// Delete the wrong character
			await page.keyboard.press('Backspace');
			await page.waitForTimeout(200 + Math.random() * 100);

			// Type correct character
			await element.type(text[i]);
		} else {
			// Type normal character
			await element.type(text[i]);
		}
	}

	// Add a natural pause after completing typing
	await page.waitForTimeout(500 + Math.random() * 300);
}

async function simulateTextInput(page: Page, element: ElementHandle<SVGElement | HTMLElement>, text: string): Promise<void> {
	// first do some mouse movement
	await simulateNaturalMouseMovement(page);

	// then click on the element
	await simulateElClick(page, element);

	await typeHumanLike(page, element, text);
	// Add a natural pause after completing typing
	await page.waitForTimeout(500 + Math.random() * 300);
}

// Main scraping function
async function useBrowser(operation: (page: Page, context: BrowserContext) => Promise<void>): Promise<void> {
	// Launch a browser with verbose logging and disable web security to avoid strict CORS
	const context = await chromium.launchPersistentContext('/Users/Arthur/code/delfi-web/chrome-data', {
		headless: false,           // Set to true to run in headless mode
		slowMo: 50,                // Reduce the slowdown for more natural behavior
		timeout: 30000,            // Increased timeout for better reliability
		args: [
			'--disable-blink-features=AutomationControlled',  // Hide automation flags
			'--disable-features=IsolateOrigins,site-per-process', // Disables site isolation
			'--no-sandbox',          // Less restrictive sandbox
			'--disable-web-security', // Bypass some CORS restrictions
			'--disable-features=site-per-process',
			'--start-maximized'      // Start with maximized window
		],
		userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
		viewport: { width: 1280, height: 800 },
		deviceScaleFactor: 1.75,  // Higher for retina-like display
		hasTouch: false,
		locale: 'en-US',
		timezoneId: 'America/Los_Angeles',
		geolocation: { longitude: -118.24, latitude: 34.05 },
		permissions: ['geolocation'],
		acceptDownloads: true,
		ignoreHTTPSErrors: true,  // Ignore HTTPS errors
		extraHTTPHeaders: {       // Add common headers
			'Accept-Language': 'en-US,en;q=0.9',
			'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
			'Accept-Encoding': 'gzip, deflate, br',
			'Connection': 'keep-alive',
			'Upgrade-Insecure-Requests': '1'
		}
	});

	try {
		// Create a new page
		const page = await context.pages()[0] || await context.newPage();
		await operation(page, context);
	} catch (error) {
		// Log any errors that occur
		console.error('Scraping error:', error);
	} finally {
		// Close the browser
		console.log('Closing browser...');
		await context.close();
		console.log('Browser closed');
	}
}

// Run the scraper
export async function testScrape() {
	await useBrowser(async (page, context) => {
		// Set timeout for navigation
		page.setDefaultTimeout(10000);

		const institution = InstitutionScrapers['AmericaFirstCreditUnion'];

		// Navigate to the target website
		console.log('Navigating to America First Credit Union login page...');
		await page.goto(institution.loginUrl);
		console.log('Page loaded, waiting for login elements...');

		// First check to see if we are already logged in
		const loggedInElement = await page.waitForSelector(institution.hasLoggedInElement, { timeout: 5000 }).catch(() => null);
		if (!loggedInElement) {
			// check for login element
			await page.waitForSelector(institution.isAtLoginElement, { timeout: 5000 });
			console.log('At login page, proceeding with login sequence...');
			// Perform the login sequence
			await doPageActions(page, institution.getLoginSequence('26739094', 'be13strong51'));

			// check for logged in element again
			const loggedInElement = await page.waitForSelector(institution.hasLoggedInElement, { timeout: 5000 }).catch(() => null);
			if (!loggedInElement) {
				console.error('Login failed, did not find logged in element');
				return;
			}
			console.log('Login successful, found logged in element');
		}

		console.log(await institution.getAccountDetails(page, {
			account_id: 'test-account-id',
			external_account_id: 'test-external-account-id',
			scraper_navigation_id: '2',
		}));

	});
};

type TextInputAction = {
	action: 'type';
	selector: string;
	text: string;
}

type ClickAction = {
	action: 'click';
	selector: string;
}

type PageAction = TextInputAction | ClickAction;

async function doPageActions(page: Page, actions: PageAction[]): Promise<void> {
	for (const action of actions) {
		const element = await page.waitForSelector(action.selector);
		if (!element) {
			console.warn(`Element not found for action: ${action.action} on selector: ${action.selector}`);
			continue;
		}

		switch (action.action) {
			case 'type':
				await simulateTextInput(page, element, action.text || '');
				break;
			case 'click':
				await simulateElClick(page, element);
				break;
			default:
				console.warn(`Unknown action`, action);
		}
	}
}


type AccountIdentifiers = {
	account_id: string;
	external_account_id: string;
	scraper_navigation_id?: string;
}

type InstitutionScraper = {
	loginUrl: string;
	hasLoggedInElement: string;
	isAtLoginElement: string;
	isLoggedOutElement: string;
	getLoginSequence: (username: string, password: string) => PageAction[];
	getAccountDetails: (page: Page, account: AccountIdentifiers) => Promise<Partial<AccountDetails>>;
	getAccountTransactions: (page: Page, account: AccountIdentifiers) => Promise<Array<TransactionEventDetails>>;
}

const InstitutionScrapers: Record<string, InstitutionScraper> = {
	'AmericaFirstCreditUnion': {
		loginUrl: 'https://secure.americafirst.com/#/login',
		hasLoggedInElement: 'div.welcome-message',
		isAtLoginElement: 'input#name-callback-1',
		isLoggedOutElement: 'a[data-aa-tracking="login"]',
		getLoginSequence: (username, password) => [
			{
				action: 'type',
				selector: 'input#name-callback-1',
				text: username,
			},
			{
				action: 'click',
				selector: 'button#btn-next',
			},
			{
				action: 'type',
				selector: 'input#password-callback-1',
				text: password,
			},
			{
				action: 'click',
				selector: 'button#btn-next',
			}
		],
		async getAccountTransactions(page, account: AccountIdentifiers): Promise<Array<TransactionEventDetails>> {
			// Implement the logic to get account details
			const accountPageUrl = `https://webaccess45.americafirst.com/banking/Accounts/Details/Index/${account.scraper_navigation_id}`;
			await page.goto(accountPageUrl);

			const transactions: Array<TransactionEventDetails> = [];
			await page.waitForSelector('#PastTransactionsGrid');

			let pendingRows = await page.locator('#UpcomingTransactionsGrid tbody tr').all();
			for (const row of pendingRows) {
				const date = await row.locator('.column-date').innerText();
				const description = await row.locator('.column-description').innerText();
				const amountCols = await row.locator('.column-amount').all();
				const amount = (await amountCols[amountCols.length - 1].innerText()).replaceAll(/[$,]/g, '');
				transactions.push({
					date: stringToDate(date),
					original_description: description,
					memo: description,
					amount: -dollarsToNumber(amount), // AFCU shows pending debits with absolute value 
					target_account_id: account.account_id,
					pending: true, // Mark as pending
				});
			};

			let rows = await page.locator('#PastTransactionsGrid tbody tr').all();
			for (const row of rows) {
				const date = await row.locator('.column-date').innerText();
				const description = await row.locator('.column-description').innerText();
				const amountCols = await row.locator('.column-amount').all();
				const amount = (await amountCols[amountCols.length - 1].innerText()).replaceAll(/[$,]/g, '');
				transactions.push({
					date: stringToDate(date),
					original_description: description,
					memo: description,
					amount: dollarsToNumber(amount),
					target_account_id: account.account_id,
				});
			};

			return transactions;
		},

		async getAccountDetails(page, account: AccountIdentifiers) {
			// Implement the logic to get account details
			const accountPageUrl = `https://webaccess45.americafirst.com/banking/Accounts/Details/Index/${account.scraper_navigation_id}`;
			await page.goto(accountPageUrl);

			const mask = (await page.locator('.account-number').innerText()).replaceAll('*', '');
			console.log('Account mask:', mask);

			async function getMatchingRowValue(searchText: string): Promise<string | null> {
				const row = await page.locator('.account-details .row', { hasText: searchText }).first();
				const text = await row?.locator('.detail-item').innerText();
				return text ? text.trim() : null;
			}
			const afcuType = await getMatchingRowValue('Type:');
			const afcuName = await getMatchingRowValue('Nickname:');
			const currentBalance = await getMatchingRowValue('Current Balance:');
			const availableBalance = await getMatchingRowValue('Available Balance:');


			return {
				mask: mask || undefined,
				current_balance: currentBalance ? dollarsToNumber(currentBalance) : undefined,
				available_balance: availableBalance ? dollarsToNumber(availableBalance) : undefined,
				external_name: afcuName || undefined,
			}
		}
	}
}




const DateRegex: Record<string, RegExp> = {
	MMDDYYYY: /^(?<month>\d{1,2})\/(?<day>\d{1,2})\/(?<year>\d{4})$/,
	YYYYMMDD: /^(?<year>\d{4})\/(?<month>\d{1,2})\/(?<day>\d{1,2})$/,
}

const stringToDate = (dateStr: string, regex?: RegExp): DelfiDate => {
	if (!dateStr) {
		throw new Error("stringToDate requires date. Got " + JSON.stringify({date: dateStr, regex}));
	}

	if (regex) {
		const match = regex.exec(dateStr);
		if (!match?.groups) {
			throw new Error("stringToDate could not parse date. Got " + dateStr);
		}
		return date(new Date(Number(match.groups.year!), Number(match.groups.month!) - 1, Number(match.groups.day!)));
	}
	return date(dateStr);
}

const formatDate = (date) => {
	if (!(date instanceof Date)) {
		date = stringToDate(date);
	}
	return date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

const dollarsToNumber = (dollars) => {
	if (!dollars) {
		return 0;
	}
	if (typeof dollars !== "string") {
		throw new Error("dollars must be a string. Got " + dollars);
	}
	return Number(dollars.replaceAll(/[$,]/g, ''));
}

const numberToDollars = (number) => {
	if (!number) {
		return 0;
	}
	if (typeof number !== "number") {
		throw new Error("number must be a number. Got " + number);
	}
	return number.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
