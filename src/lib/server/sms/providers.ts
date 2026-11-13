import "server-only";
import {
  isAfricaTalkingConfigured,
  sendAfricaTalkingSms,
} from "@/lib/server/africastalking";
import { termiiProvider } from "@/lib/server/sms/termii";
import type { SmsProvider } from "@/lib/server/sms/types";

const africasTalkingProvider: SmsProvider = {
  name: "africastalking",
  isConfigured: isAfricaTalkingConfigured,
  send: sendAfricaTalkingSms,
};

/** Every adapter the app knows, in the default order to try them. */
export const SMS_PROVIDERS: SmsProvider[] = [africasTalkingProvider, termiiProvider];
