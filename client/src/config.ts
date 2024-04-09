import { join } from "node:path";

require("dotenv").config({
	path: join(__dirname, "..", "..", ".env"),
});

export default {
	CLIENT_NAME: process.env.CLIENT_NAME,
	CLIENT_ID: process.env.CLIENT_ID,
};
