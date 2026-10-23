// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { StepReview } from "../step-review";
import type { ProSignupForm } from "../use-pro-signup-form";

const mockForm: ProSignupForm = {
  fullName: "Adeola Pro",
  gender: "male",
  dateOfBirth: "1990-05-15",
  businessName: "Adeola Autos",
  fullPhone: "+2348012345678",
  phoneDial: "+234",
  phoneNational: "8012345678",
  email: "adeola@example.com",
  idNumber: "12345678901",
  bvn: "22233344455",
  area: "Ikeja",
  city: "Lagos",
  serviceRadiusKm: 5,
  yearsExperience: "5",
  bio: "Certified auto specialist with 5 years experience.",
  guarantorName: "Babatunde Adeola",
  guarantorPhone: "+2348098765432",
  guarantorAddress: "",
  guarantorOccupation: "",
  guarantorRelationship: "Brother",
  password: "Password123!",
  confirmPassword: "Password123!",
  phoneIso: "NG",
  dualSignup: false,
  nameLocked: false,
  genderLocked: false,
  dobLocked: false,
  phoneLocked: false,
  emailLocked: false,
  ninLocked: false,
  bvnLocked: false,
  fieldErrors: {},
  setFullName: () => {},
  setGender: () => {},
  setDateOfBirth: () => {},
  setBusinessName: () => {},
  setPhoneDial: () => {},
  setPhoneNational: () => {},
  setPhoneIso: () => {},
  setEmail: () => {},
  setPassword: () => {},
  setConfirmPassword: () => {},
  setIdNumber: () => {},
  setBvn: () => {},
  setCity: () => {},
  setArea: () => {},
  setServiceRadiusKm: () => {},
  setYearsExperience: () => {},
  setBio: () => {},
  setGuarantorName: () => {},
  setGuarantorPhone: () => {},
  setGuarantorAddress: () => {},
  setGuarantorOccupation: () => {},
  setGuarantorRelationship: () => {},
  setFieldError: () => {},
};

describe("StepReview dark/light visibility", () => {
  it("renders values with high-contrast text-white in dark mode", () => {
    const { container } = render(
      <StepReview
        form={mockForm}
        skill="mechanic"
        specialty="Engine Diagnostics"
        vehiclesCanFix={[]}
        isLight={false}
      />,
    );

    const nameValue = container.querySelector("span.text-white");
    expect(nameValue).toBeTruthy();
    expect(container.textContent).toContain("Adeola Pro");
    expect(container.textContent).toContain("Adeola Autos");
    expect(container.textContent).toContain("Mechanic");

    // Must not have invisible dark text in dark mode
    const invisibleElements = container.querySelectorAll(".text-\\[\\#1d1d1f\\]");
    expect(invisibleElements.length).toBe(0);
  });

  it("renders values with text-[#1d1d1f] in light mode", () => {
    const { container } = render(
      <StepReview
        form={mockForm}
        skill="mechanic"
        specialty="Engine Diagnostics"
        vehiclesCanFix={[]}
        isLight={true}
      />,
    );

    const nameValue = container.querySelector("span.text-\\[\\#1d1d1f\\]");
    expect(nameValue).toBeTruthy();
    expect(container.textContent).toContain("Adeola Pro");
  });
});
