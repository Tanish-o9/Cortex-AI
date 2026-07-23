import { initializeApp, cert } from "firebase-admin/app";

import serviceAccount from "../serviceAccount.json" with { type: "json" };

let credential;
try {
  credential = cert(serviceAccount);
} catch (e) {
  console.warn("⚠️ Warning: Firebase cert initialization failed, using mock credential:", e.message);
  credential = {
    getAccessToken: () => Promise.resolve({
      access_token: "mock-access-token",
      expires_in: 3600,
    }),
  };
}

export const app = initializeApp({
  credential,
});