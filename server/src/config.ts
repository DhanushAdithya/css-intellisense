import { join } from "node:path";

require("dotenv").config({
	path: join(__dirname, "..", "..", ".env"),
});

export default {};
