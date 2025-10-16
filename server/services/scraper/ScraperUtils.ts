// Simple Playwright scraper to navigate to American First Credit Union login page
import { chromium, type Page, type ElementHandle, type BrowserContext, type Browser } from 'playwright';
import { ddate, type DelfiDate } from 'delfi-core/utils/dateUtils';

let browserInstance: Browser | null = null;

async function createBrowserContext(): Promise<BrowserContext> {
	if (!browserInstance) {
		browserInstance = await chromium.launch({
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
        // Cleanup on process exit
        process.on('exit', cleanupBrowser);
        process.on('SIGINT', cleanupBrowser);
        process.on('SIGTERM', cleanupBrowser);
	}

	return await browserInstance.newContext({
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
		recordVideo: {
			dir: './videos',
			size: { width: 1280, height: 800 }
		},
		extraHTTPHeaders: {       // Add common headers
			'Accept-Language': 'en-US,en;q=0.9',
			'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
			'Accept-Encoding': 'gzip, deflate, br',
			'Connection': 'keep-alive',
			'Upgrade-Insecure-Requests': '1'
		}
	});
};

async function cleanupBrowser(): Promise<void> {
    if (browserInstance) {
        try {
            await browserInstance.close();
            browserInstance = null;
        } catch (error) {
            console.error('Error closing browser:', error);
        }
    }
}

export type UsePage = (pageOperation: (page: Page) => Promise<void>) => Promise<void>;

export async function useBrowser<T>(operation: (usePage: UsePage) => Promise<T>): Promise<T> {
	const context = await createBrowserContext();

	// Provide this function to consumers to handle disposing pages
	async function usePage(pageOperation: (page: Page) => Promise<any>) {
		const newPage = await context.newPage();
		try {
			return await pageOperation(newPage);
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
		return await operation(usePage);
	} catch (error) {
		// Log any errors that occur
		console.error('Scraping error:', error);
		throw error; // Re-throw to ensure the error is not swallowed
	} finally {
		// Close the browser
		try {
			await context.close();
			console.log('Browser context closed');
		} catch (closeError) {
			console.error('Error closing browser context:', closeError);
		}
	}
}

type PageActions = {
	Wait: {
		action: 'wait';
		time: number;
	};
	TextInput: {
		action: 'type';
		selector: string;
		text: string;
	};
	Click: {
		action: 'click';
		selector: string;
	};
	CloudflareCaptcha: {
		action: 'cloudflareCaptcha';
		selector: string;
	};
}

export type PageAction = PageActions[keyof PageActions];

export async function doPageActions(page: Page, actions: PageAction[]): Promise<void> {
	for (const action of actions) {
		switch (action.action) {
			case 'type': {
				const element = await page.waitForSelector(action.selector);
				if (action.selector && !element) {
					console.warn(`Element not found for action: ${action.action} on selector: ${action.selector}`);
					continue;
				}
				await simulateTextInput(page, element, action.text || '');
			}
				break;
			case 'click': {
				const element = await page.waitForSelector(action.selector);
				if (action.selector && !element) {
					console.warn(`Element not found for action: ${action.action} on selector: ${action.selector}`);
					continue;
				}
				await simulateElClick(page, element);
				break;
			}
			// case 'cloudflareCaptcha':
			// 	await doCloudflareCaptcha(page, action.selector);
			// 	break;
			case 'wait':
				await page.waitForTimeout(action.time);
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
		throw new Error("stringToDate requires date. Got " + JSON.stringify({ date: dateStr, regex }));
	}

	if (regex) {
		const match = regex.exec(dateStr);
		if (!match?.groups) {
			throw new Error("stringToDate could not parse date. Got " + dateStr);
		}
		return ddate(new Date(Number(match.groups.year!), Number(match.groups.month!) - 1, Number(match.groups.date!)));
	}
	return ddate(dateStr);
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

/**
 * Moves the mouse from its current position to target coordinates using a natural bezier curve
 * @param page The Playwright page object
 * @param targetX The target X coordinate
 * @param targetY The target Y coordinate
 * @param numPoints Number of points along the bezier curve (default: 12)
 */
async function simulateMouseMove(page: Page, targetX: number, targetY: number, numPoints: number = 12): Promise<void> {
	// Get current mouse position or use a default
	const currentPosition = await page.evaluate<Point>(() => {
		return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
	});

	// Generate a natural path to the target coordinates
	const points = generateBezierPoints(
		currentPosition.x,
		currentPosition.y,
		targetX,
		targetY,
		numPoints
	);

	// Move along the path with variable speed
	for (const point of points) {
		await page.mouse.move(point.x, point.y, { steps: 1 });
		await page.waitForTimeout(10 + Math.random() * 30);
	}
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

	// Target is center of button with slight randomness
	const targetX = bounds.x + bounds.width / 2 + (Math.random() * 6 - 3);
	const targetY = bounds.y + bounds.height / 2 + (Math.random() * 6 - 3);

	// Use the extracted mouse movement function
	await simulateMouseMove(page, targetX, targetY, 12);

	// Add a slight delay before clicking (humans don't click instantly)
	await page.waitForTimeout(300 + Math.random() * 200);
	await page.mouse.click(targetX, targetY, { delay: 50 + Math.random() * 100 }); // Variable click duration
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

// async function clickCoordinates(page: Page, clickX, clickY): Promise<void> {
// 	// Move mouse and click at the calculated position
// 	await simulateMouseMove(page, clickX, clickY);
// 	await page.mouse.click(clickX, clickY);
// }

// async function doCloudflareCaptcha(page: Page, selector: string): Promise<void> {
// 	try {
// 		// Find the iframe that contains the captcha
// 		const iframe = await page.locator(selector).first();

// 		// Get the bounding box of the iframe
// 		const boundingBox = await iframe.boundingBox();

// 		if (!boundingBox) {
// 			throw new Error("Could not determine iframe position");
// 		}

// 		// Approximate checkbox location
// 		const offsetX = 35;
// 		const offsetY = 35;

// 		// Calculate absolute coordinates
// 		const clickX = boundingBox.x + offsetX;
// 		const clickY = boundingBox.y + offsetY;

// 		page.evaluate((...args) => {
// 			document.body.insertAdjacentHTML('beforeEnd' as any, `<div style=\`border: 5px solid red; position: fixed; left: ${35}px; top: ${35}px;'></div>`);
// 		}, [ clickX, clickY ]);

// 		// Move mouse and click at the calculated position
// 		await simulateMouseMove(page, clickX, clickY);
// 		await page.mouse.click(clickX, clickY);

// 		console.log(`Clicked captcha at (${clickX}, ${clickY})`);
// 		// Wait to see if captcha is solved
// 		await page.waitForTimeout(2000);
// 	} catch (error) {
// 		console.error("Error clicking captcha by coordinates:", error);
// 	}
// }

export async function find(locator, selector, options = {}) {
	const count = await locator.locator(selector, options).count();
	if (count > 0) {
		return await locator.locator(selector, options).first();
	}
	return null;
}

	