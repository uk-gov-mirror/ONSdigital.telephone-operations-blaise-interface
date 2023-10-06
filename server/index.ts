import BlaiseApiClient from "blaise-api-node-client";
import nodeServer from "./server";
import * as profiler from "@google-cloud/profiler";
import { getEnvironmentVariables } from "./Config";
import dotenv from "dotenv";

profiler.start({logLevel: 4}).catch((err: unknown) => {
    console.log(`Failed to start profiler: ${err}`);
});

if (process.env.NODE_ENV !== "production") {
    dotenv.config();
}
// load the .env variables in the server
const {
    BLAISE_API_URL,
} = getEnvironmentVariables();

const port: string = process.env.PORT || "5000";

// create client
const blaiseApiClient = new BlaiseApiClient(BLAISE_API_URL);

// create app
const app = nodeServer(blaiseApiClient);

app.listen(port);

console.log("App is listening on port " + port);
