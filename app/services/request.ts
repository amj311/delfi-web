import axios from "axios";
import { AuthService } from "./authService";

const baseURL = window.location.href.includes('localhost:517') ? 'http://localhost:5000/api' : '/api'

const request = axios.create({
	baseURL,
})

request.interceptors.request.use(async (config) => {
	const token = await AuthService.getToken();
	if (token) {
		config.headers.Authorization = token;
	}
	return config;
});


request.interceptors.response.use(null, (error) => {
	if (error.isAxiosError && error.response?.status === 401) {
		console.log("Received unauthorized response. Logging out");
		AuthService.signOut();
	}
	throw error;
})

export default request;