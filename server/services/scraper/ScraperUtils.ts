// Simple Playwright scraper to navigate to American First Credit Union login page
import { chromium, type Page, type ElementHandle, type BrowserContext } from 'playwright';
import { date, type DelfiDate } from 'delfi-core/utils/dateUtils';

async function createBrowserContext(): Promise<BrowserContext> {
	const browser = await chromium.launch({
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
	});

	return await browser.newContext({
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
};

export type UsePage = (pageOperation: (page: Page, context: BrowserContext) => Promise<void>) => Promise<void>;

export async function useBrowser(operation: (usePage: UsePage, context: BrowserContext) => Promise<void>): Promise<void> {
	const context = await createBrowserContext();

	// Provide this function to consumers to handle disposing pages
	async function usePage(pageOperation: (page: Page, context: BrowserContext) => Promise<void>) {
		const newPage = await context.newPage();
		try {
			await pageOperation(newPage, context);
		}
		catch (error) {
			console.error('Error occurred while using page:', error);
			throw error; // Re-throw to handle it in the main operation
		}
		finally {
			await newPage.close();
		}
	}

	try {
		await operation(usePage, context);
	} catch (error) {
		// Log any errors that occur
		console.error('Scraping error:', error);
		throw error; // Re-throw to ensure the error is not swallowed
	} finally {
		// Close the browser
		context.close().then(() => {
			console.log('Browser context closed after operation.');
		}).catch(err => {
			console.error('Error closing browser context:', err);
			throw err; // Re-throw to ensure the error is not swallowed
		});
	}
}

type TextInputAction = {
	action: 'type';
	selector: string;
	text: string;
}

type ClickAction = {
	action: 'click';
	selector: string;
}

export type PageAction = TextInputAction | ClickAction;

export async function doPageActions(page: Page, actions: PageAction[]): Promise<void> {
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


export const DateRegex: Record<string, RegExp> = {
	MMDDYYYY: /^(?<month>\d{1,2})\/(?<date>\d{1,2})\/(?<year>\d{4})$/,
	YYYYMMDD: /^(?<year>\d{4})\/(?<month>\d{1,2})\/(?<date>\d{1,2})$/,
}

export const stringToDate = (dateStr: string, regex?: RegExp): DelfiDate => {
	if (!dateStr) {
		throw new Error("stringToDate requires date. Got " + JSON.stringify({date: dateStr, regex}));
	}

	if (regex) {
		const match = regex.exec(dateStr);
		if (!match?.groups) {
			throw new Error("stringToDate could not parse date. Got " + dateStr);
		}
		return date(new Date(Number(match.groups.year!), Number(match.groups.month!) - 1, Number(match.groups.date!)));
	}
	return date(dateStr);
}

export const formatDate = (date) => {
	if (!(date instanceof Date)) {
		date = stringToDate(date);
	}
	return date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export const dollarsToNumber = (dollars) => {
	if (!dollars) {
		return 0;
	}
	if (typeof dollars !== "string") {
		throw new Error("dollars must be a string. Got " + dollars);
	}
	return Number(dollars.replaceAll(/[$,]/g, ''));
}

export const numberToDollars = (number) => {
	if (!number) {
		return 0;
	}
	if (typeof number !== "number") {
		throw new Error("number must be a number. Got " + number);
	}
	return number.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}



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
	// await simulateNaturalMouseMovement(page);

	// then click on the element
	await simulateElClick(page, element);

	await typeHumanLike(page, element, text);
	// Add a natural pause after completing typing
	await page.waitForTimeout(500 + Math.random() * 300);
}