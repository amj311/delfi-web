import { useUserStore } from '@/stores/user.store';
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signInWithRedirect, type Auth } from 'firebase/auth';

const firebaseConfig = {
	apiKey: import.meta.env.VITE_FB_API_KEY,
	authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN,
	databaseURL: import.meta.env.VITE_FB_DB_URL,
	projectId: import.meta.env.VITE_FB_PROJECT_ID,
	storageBucket: import.meta.env.VITE_FB_STORAGE_BUCKET,
	messagingSenderId: import.meta.env.VITE_FB_MESSAGING_SENDER_ID,
	appId: import.meta.env.VITE_FB_APP_ID,
};

let firebaseApp: FirebaseApp;
let auth: Auth;

export const AuthService = {
	onLogInOrOut: (authUser) => {},

	async setupAuth() {
		firebaseApp = initializeApp(firebaseConfig);
		auth = getAuth(firebaseApp);
		auth.useDeviceLanguage();
	
		onAuthStateChanged(auth, (authUser) => {
			this.onLogInOrOut?.call(null, authUser);
		})
	},

	get currentUser() {
		return auth?.currentUser;
	},

	get authUser() {
		return auth?.currentUser;
	},

	async getToken() {
		return await auth?.currentUser?.getIdToken();
	},

	async createEmailUser(email, password, givenName, familyName) {
		// flag user store to create new user
		useUserStore().setNewUserData({givenName, familyName});
		// register firebase user
		let newFbUser;
		try {
			const userCredential = await createUserWithEmailAndPassword(auth, email, password);
			newFbUser = userCredential.user;
		}
		catch (error: any) {
			console.log('createEmailUser error', error)
			throw new Error(error.message);
		}

		this.onLogInOrOut?.call(null, newFbUser);
	},

	async signInWithEmail(email, password) {
		try {
			const userCredential = await signInWithEmailAndPassword(auth, email, password);
			const user = userCredential.user;
			return user;
		} catch (error: any) {
			throw new Error(error.message);
		}
	},

	// SIGN IN WITH GOOGLE IS NOT WORKING!
	async signInWithGoogle() {
		try {
			// if (isWeb) {
				const provider = new GoogleAuthProvider();
				const userCredential:any = await signInWithPopup(auth, provider);
				const user = userCredential.user;
				return user;				
			// }
			// else {
			// 	this.info.push('google signin with credential')
			// 	let googleUser = await GoogleAuth.signIn();
			// 	const googleCredential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
			// 	const userCredential:any = await signInWithCredential(auth, googleCredential);
			// 	const user = userCredential.user;
			// 	return user;
			// }
			
		} catch (error: any) {
			console.log('signInWithGoogle error', error)
			throw new Error(error.message);
		}
	},

	async signOut() {
		try {
			await signOut(auth);
		} catch (error: any) {
			throw new Error(error.message);
		}
	},
}
