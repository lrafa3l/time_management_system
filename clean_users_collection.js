const admin = require('firebase-admin');

try {
    // Initialize Firebase Admin SDK with service account key
    const serviceAccount = require('./serviceAccountKey.json');

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: 'https://schedule-system-8c4b6-default-rtdb.firebaseio.com'
    });

    console.log('Firebase Admin SDK initialized successfully.');

    const db = admin.firestore();

    async function cleanUsersCollection() {
        try {
            console.log('Starting migration to clean users collection...');
            const usersSnapshot = await db.collection('users').get();

            if (usersSnapshot.empty) {
                console.log('No documents found in users collection.');
                return;
            }

            const batch = db.batch();
            let count = 0;

            for (const userDoc of usersSnapshot.docs) {
                const userData = userDoc.data();
                const cleanedData = {
                    role: userData.role || 'user'
                };
                batch.set(userDoc.ref, cleanedData);
                count++;
            }

            await batch.commit();
            console.log(`Successfully cleaned ${count} documents in users collection.`);
        } catch (error) {
            console.error('Error during cleanup:', error);
            process.exit(1);
        }
    }

    cleanUsersCollection().then(() => {
        console.log('Migration completed.');
        process.exit(0);
    });

} catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error.message);
    console.error('Ensure the service-account-key.json file exists and is correctly configured.');
    process.exit(1);
}