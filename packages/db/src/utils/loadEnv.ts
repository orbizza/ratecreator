import dotenv from "dotenv";
import path from "path";

// Load the main .env file
dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });

// Load additional .env files if needed
// dotenv.config({
//   path: path.resolve(__dirname, "../../apps/webhooks/clerk-sync/.env"),
// });
