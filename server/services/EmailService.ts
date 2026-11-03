import { MailtrapClient, type Address } from "mailtrap";
const TOKEN = process.env.MAILTRAP_API_TOKEN || '';

const client = new MailtrapClient({
  token: TOKEN,
});

const addresses = {
	system: {
		email: process.env.SYSTEM_SEND_FROM_EMAIL || '',
		name: process.env.SYSTEM_SEND_FROM_NAME || '',
	}
} as const;

type EmailConfig = {
	// template?: Template,
	to?: Array<Address>,
	subject: string,
	text: string,
	html?: string,
}

async function sendEmail(props: EmailConfig) {
	if (!props.to) {
		throw new Error("No recipients")
	}

	try {
		const res =	await client.send({
			from: addresses['system'],
			to: props.to,
			subject: props.subject,
			text: props.text,
			html: props.html,
		})
		console.log(res);
	}
	catch (e) {
		console.error(e);
		throw new Error("Email sending failed")
	}
}

export const EmailService = {
	sendEmail,
}