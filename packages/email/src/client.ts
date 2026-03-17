import { Resend } from "resend";
import { RESEND_API_KEY } from "./constants";

let resendInstance: Resend | null = null;

export function getResendClient(): Resend {
  if (!resendInstance) {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY environment variable is not set");
    }
    resendInstance = new Resend(RESEND_API_KEY);
  }
  return resendInstance;
}
