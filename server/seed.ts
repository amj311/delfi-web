import 'dotenv/config';

import { TestDataService } from './services/TestDataService';

(async () => {
	await TestDataService.seed();
})();
