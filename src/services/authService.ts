import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signInWithRedirect, type Auth } from 'firebase/auth';

let firebaseApp: FirebaseApp;
let auth: Auth;

export const AuthService = {
	onLogInOrOut: (authUser) => {},
	
	async setupAuth(config) {
		firebaseApp = initializeApp(config);
		auth = getAuth(firebaseApp);
		auth.useDeviceLanguage();
	
		onAuthStateChanged(auth, (authUser) => {
			this.onLogInOrOut?.call(null, authUser);
		})
	},

	get currentUser() {
		return auth?.currentUser;
	},

	async getToken() {
		return await auth?.currentUser?.getIdToken();
	},

	async createEmailUser(email, password) {
		try {
			const userCredential = await createUserWithEmailAndPassword(auth, email, password);
			const user = userCredential.user;
			return user;
		} catch (error: any) {
			throw new Error(error.message);
		}
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

	async signInWithGoogle() {
		try {
			const provider = new GoogleAuthProvider();
			const userCredential:any = await signInWithRedirect(auth, provider);
			const user = userCredential.user;
			return user;
		} catch (error: any) {
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
