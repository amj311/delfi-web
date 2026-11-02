const webpush = require('web-push');

/**
 * Generates VAPID credentials and prints them.
 */
async function generateVapidKeys() {
    console.log("--- Starting VAPID Key Generation ---");
    
    try {
        // generateVapid is asynchronous and uses a callback or Promise structure.
        // We will use the built-in promise-like pattern for cleaner code.
        const credentials = await webpush.generateVAPIDKeys(async (error, credentials) => {
            if (error) {
                console.error("Error generating credentials:", error);
                return;
            }
                
            console.log("\n=======================================");
            console.log("🔑 PUBLIC KEY (For Sharing/Logging):");
            console.log(credentials.publicKey);
            console.log("\n🔒 PRIVATE KEY (KEEP SECRET! For Environment Variables):");
            console.log(credentials.privateKey);
            console.log("=======================================");
        });
        console.log(credentials)
        
        // Note: Depending on the version, the callback structure might require logging 
        // the results from the function scope. The key is that the key pair is generated.

    } catch (e) {
        console.error("An unexpected error occurred during key generation:", e);
    }
}

// Run the function
generateVapidKeys();
