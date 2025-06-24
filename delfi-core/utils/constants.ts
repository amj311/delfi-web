export enum MONTHS {"JAN"=0,"FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"};

export const colors = {
	gray1: "#F8F9FA",
	gray2: "#F4F5F6",
	gray3: "#F0F1F2",
	gray4: "#E1E3E5",
	gray5: "#D8DADE",
	gray6: "#C0C3C8",
	gray7: "#ACB0B6",
	gray8: "#90959B",
	gray9: "#798087",
	gray10: "#565F66",
	gray11: "#363F44",
	gray12: "#1F2528",
	gray13: "#101516",

	tag_red3: "#ff886e",
	tag_red4: "#F14035",
	tag_red6: "#AF0015",
	tag_orange3: "#FEAD62",
	tag_orange4: "#EB7319",
	tag_orange5: "#C94C00",
	tag_yellow4: "#F8C220",
	tag_yellow5: "#CF9500",
	tag_yellow6: "#996504",
	tag_green3: "#AED70D",
	tag_green4: "#7CB100",
	tag_green5: "#348500",
	tag_teal4: "#09D4CB",
	tag_teal5: "#0AB2AC",
	tag_teal6: "#007E88",
	tag_blue3: "#7DC9FF",
	tag_blue4: "#14A6F8",
	tag_blue6: "#274FDB",
	tag_violet4: "#865CFF",
	tag_violet5: "#7031F5",
	tag_violet6: "#471FBA",
	tag_pink4: "#E55EC8",
	tag_pink5: "#C50099",
	tag_pink6: "#95007D",
}


const IconSources = [
	'material-symbols',
] as const;
export type IconSource = typeof IconSources[number];

export const tagColors = [
	"tag_red3",
	"tag_red4",
	"tag_red6",
	"tag_orange3",
	"tag_orange4",
	"tag_orange5",
	"tag_yellow4",
	"tag_yellow5",
	"tag_yellow6",
	"tag_green3",
	"tag_green4",
	"tag_green5",
	"tag_teal4",
	"tag_teal5",
	"tag_teal6",
	"tag_blue3",
	"tag_blue4",
	"tag_blue6",
	"tag_violet4",
	"tag_violet5",
	"tag_violet6",
	"tag_pink4",
	"tag_pink5",
	"tag_pink6",
]

export type Icon = {
	name: string,
	source: IconSource,
	source_id: string,
}

export const Icons = {
	"bank": {
		name: "bank",
		source: "material-symbols",
		source_id: "account_balance",
	},
	"briefcase": {
		name: "briefcase",
		source: "material-symbols",
		source_id: "work",
	},
	"car": {
		name: "car",
		source: "material-symbols",
		source_id: "directions_car",
	},
	
	"chart-line": {
		name: "chart-line",
		source: "material-symbols",
		source_id: "shopping_cart",
	},
	"child": {
		name: "child",
		source: "material-symbols",
		source_id: "child_care",
	},
	"compass": {
		name: "compass",
		source: "material-symbols",
		source_id: "explore",
	},
	"commute": {
		name: "commute",
		source: "material-symbols",
		source_id: "commute",
	},

	"dollar-bills": {
		name: "dollar-bills",
		source: "material-symbols",
		source_id: "payments",
	},
	"fastfood": {
		name: "fastfood",
		source: "material-symbols",
		source_id: "fastfood",
	},
	"faucet": {
		name: "faucet",
		source: "material-symbols",
		source_id: "faucet",
	},
	"gavel": {
		name: "gavel",
		source: "material-symbols",
		source_id: "gavel",
	},
	"gift": {
		name: "gift",
		source: "material-symbols",
		source_id: "featured_seasonal_and_gifts",
	},
	"graduation-cap": {
		name: "graduation-cap",
		source: "material-symbols",
		source_id: "school",
	},
	"grocery": {
		name: "grocery",
		source: "material-symbols",
		source_id: "grocery",
	},
	"heartbeat": {
		name: "heartbeat",
		source: "material-symbols",
		source_id: "cardiology",
	},
	"home": {
		name: "home",
		source: "material-symbols",
		source_id: "cottage",
	},
	"lightbulb": {
		name: "lightbulb",
		source: "material-symbols",
		source_id: "lightbulb",
	},
	"money-bag": {
		name: "money-bag",
		source: "material-symbols",
		source_id: "money_bag",
	},
	"paw": {
		name: "paw",
		source: "material-symbols",
		source_id: "pets",
	},
	"question-circle": {
		name: "question-circle",
		source: "material-symbols",
		source_id: "help",
	},
	"shopping-cart": {
		name: "shopping-cart",
		source: "material-symbols",
		source_id: "shopping_cart",
	},
	"smiley": {
		name: "smiley",
		source: "material-symbols",
		source_id: "sentiment_excited",
	},
	// "toothbrush": {
	// 	name: "toothbrush",
	// 	source: "material-symbols",
	// 	source_id: "",
	// },
	"tooth": {
		name: "tooth",
		source: "material-symbols",
		source_id: "dentistry",
	},
	"transfer": {
		name: "transfer",
		source: "material-symbols",
		source_id: "swap_horiz",
	},
	"utensils": {
		name: "utensils",
		source: "material-symbols",
		source_id: "local_dining",
	},
} as const;

export type IconName = keyof typeof Icons;
