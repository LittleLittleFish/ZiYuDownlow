import { app } from "./app.js";
import { env } from "./config/env.js";

app.listen(env.API_PORT, () => {
  console.log(`${env.APP_NAME} API listening on port ${env.API_PORT}`);
});
