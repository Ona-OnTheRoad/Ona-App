import "server-only";
import { apiOk } from "@/lib/server/api-json";
import { sendSignupConfirmationEmail } from "@/lib/server/resend";
import type { SignupContext, VerifiedFlags } from "@/lib/server/signup/context";
import { logSignupEvent, passwordClient } from "@/lib/server/signup/helpers";

/** Opens the browser session, sends the confirmation email and builds the success response. */
export async function finishSignup(
  ctx: SignupContext,
  account: { userId: string; createdNew: boolean; attachUserId: string | null },
  flags: VerifiedFlags,
): Promise<Response> {
  const { supabase, input, email, role, nin, bvn, hasNin, hasBvn, eventBase } = ctx;
  const { userId, createdNew, attachUserId } = account;
  const { ninVerified: ninVerifiedOut, bvnVerified: bvnVerifiedOut } = flags;
  // 7) Issue a session for the browser (no email round-trip)
  // Dual-attach: always sign in as the existing identity email
  let signInEmail = email;
  if (attachUserId && userId) {
    try {
      const u = await supabase.auth.admin.getUserById(userId);
      const em = String(u.data.user?.email || "")
        .trim()
        .toLowerCase();
      if (em) signInEmail = em;
    } catch {
      /* keep input email */
    }
  }
  const sessionClient = await passwordClient();
  let signedIn = await sessionClient.auth.signInWithPassword({
    email: signInEmail,
    password: input.password,
  });
  // Retry once if sign-in races with createUser
  if (signedIn.error || !signedIn.data.session) {
    await new Promise((r) => setTimeout(r, 400));
    signedIn = await sessionClient.auth.signInWithPassword({
      email: signInEmail,
      password: input.password,
    });
  }
  // Confirmation email (Resend) non-blocking
  let emailSent: boolean | null = null;
  let emailError: string | null = null;
  try {
    const mail = await sendSignupConfirmationEmail({
      to: email,
      fullName: input.fullName,
      accountType: input.accountType,
    });
    emailSent = mail.ok;
    if (!mail.ok) emailError = mail.error;
  } catch (e) {
    emailSent = false;
    emailError = e instanceof Error ? e.message : "email failed";
  }

  // Still return success with profile if session missing client can auto-login
  if (signedIn.error || !signedIn.data.session || !signedIn.data.user) {
    await logSignupEvent(supabase, {
      ...eventBase,
      success: true,
      user_id: userId,
      meta: { createdNew, session: false, emailSent, emailError },
    });
    return apiOk({
      userId,
      createdNew,
      emailSent,
      session: null,
      accountType: input.accountType,
      role,
      profile: {
        id: userId,
        role,
        full_name: input.fullName,
        phone: input.phone,
        email,
        city: input.city || null,
        area: input.area || null,
        gender: input.gender,
        date_of_birth: input.dateOfBirth,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        avatar_url: null,
      },
      extras: {
        vehicleMake: input.vehicleMake,
        vehicleModel: input.vehicleModel,
        vehicleYear: input.vehicleYear,
        vehicles: input.vehicles,
        businessName: input.businessName,
        primaryService:
          input.primaryService || input.services?.[0] || undefined,
        bio: input.bio,
        yearsExperience: input.yearsExperience,
        serviceRadiusKm: input.serviceRadiusKm,
        nin: hasNin ? nin : undefined,
        bvn: hasBvn ? bvn : undefined,
        ninVerified: ninVerifiedOut,
        bvnVerified: bvnVerifiedOut,
      },
      warning:
        "Account created. Opening session failed try logging in once with the same email and password.",
    });
  }

  await logSignupEvent(supabase, {
    ...eventBase,
    success: true,
    user_id: userId,
    meta: { createdNew, session: true, emailSent, emailError },
  });

  return apiOk({
    userId,
    createdNew,
    emailSent,
    session: {
      access_token: signedIn.data.session.access_token,
      refresh_token: signedIn.data.session.refresh_token,
      expires_at: signedIn.data.session.expires_at ?? null,
    },
    accountType: input.accountType,
    role,
    profile: {
      id: userId,
      role,
      full_name: input.fullName,
      phone: input.phone,
      email,
      city: input.city || null,
      area: input.area || null,
      gender: input.gender,
      date_of_birth: input.dateOfBirth,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      avatar_url: null,
    },
    extras: {
      vehicleMake: input.vehicleMake,
      vehicleModel: input.vehicleModel,
      vehicleYear: input.vehicleYear,
      vehicles: input.vehicles,
      businessName: input.businessName,
      primaryService: input.primaryService,
      bio: input.bio,
      yearsExperience: input.yearsExperience,
      serviceRadiusKm: input.serviceRadiusKm,
      nin: hasNin ? nin : undefined,
      bvn: hasBvn ? bvn : undefined,
      ninVerified: ninVerifiedOut,
      bvnVerified: bvnVerifiedOut,
    },
  });
}
