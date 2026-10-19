"use client";

/**
 * Ona Express premium intelligent direct booking (Vehicle Services).
 * Vehicle → smart cascading questions → booking type → location →
 * price summary + upfront payment → "Trade Assigned" → negotiate extras.
 *
 * Thin composition: state lives in ./flow hooks, UI in ./flow views.
 */

import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { AssignedView } from "./flow/assigned-view";
import { BlockedView } from "./flow/blocked-view";
import { BookingView } from "./flow/booking-view";
import { CategoriesView } from "./flow/categories-view";
import { DetectedView } from "./flow/detected-view";
import { canAdvance, expressTheme } from "./flow/helpers";
import { LocationView } from "./flow/location-view";
import { PayView } from "./flow/pay-view";
import { QuestionsView } from "./flow/questions-view";
import { StepFooter } from "./flow/step-footer";
import { UrgencyView } from "./flow/urgency-view";
import { useExpressFlow } from "./flow/use-express-flow";
import { VehicleView } from "./flow/vehicle-view";

export function ExpressFlow({ isLight }: { isLight: boolean }) {
  const router = useRouter();
  const f = useExpressFlow();
  const { stage, setStage, setError, busy, goBack } = f;
  const { questions, vehicles, quoteState, schedule, payment } = f;
  const { screen } = questions;
  const { quote } = quoteState;
  const theme = expressTheme(isLight);

  const showFooter =
    (stage === "questions" || stage === "booking" || stage === "location") &&
    !(stage === "questions" && screen?.kind === "choice");

  return (
    <>
      <PageHeader title={f.title} backHref={undefined} onBack={goBack} />
      <div className="flex min-h-0 flex-1 flex-col px-3 pb-24">
        {stage === "blocked" ? (
          <BlockedView theme={theme} onBack={goBack} />
        ) : null}

        {stage === "categories" ? (
          <CategoriesView
            theme={theme}
            onPickVehicleGroup={() => {
              setStage("vehicle");
              setError(null);
            }}
          />
        ) : stage === "vehicle" ? (
          <VehicleView theme={theme} vehicles={vehicles} />
        ) : stage === "assigned" ? (
          <AssignedView
            theme={theme}
            detected={f.detected}
            assignedPro={payment.assignedPro}
            onOpenDesk={(id) => router.push(`/jobs/${id}`)}
          />
        ) : stage === "paying" ? (
          <div className="flex min-h-0 flex-1 items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-[#FF6B35]" />
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain scrollbar-hide">
            {stage === "questions" && screen ? (
              <QuestionsView
                theme={theme}
                screen={screen}
                draft={questions.draft}
                onDraftChange={(v) => {
                  questions.setDraft(v);
                  setError(null);
                }}
                onPickOption={questions.pickOption}
              />
            ) : null}

            {stage === "detected" && questions.detectedTrade ? (
              <DetectedView
                theme={theme}
                detectedTrade={questions.detectedTrade}
                onContinue={() => setStage("booking")}
                onBack={goBack}
              />
            ) : null}

            {stage === "booking" ? (
              <BookingView
                theme={theme}
                bookingType={schedule.bookingType}
                schedDate={schedule.schedDate}
                schedTime={schedule.schedTime}
                scheduleValid={schedule.scheduleValid}
                nowTs={schedule.nowTs}
                onInstant={() => {
                  schedule.setBookingType("instant");
                  quoteState.goLocation();
                }}
                onSchedule={() => schedule.setBookingType("scheduled")}
                onDateChange={schedule.setSchedDate}
                onTimeChange={schedule.setSchedTime}
              />
            ) : null}

            {stage === "location" ? (
              <LocationView
                theme={theme}
                value={quoteState.pickedLoc}
                onChange={(picked) => {
                  quoteState.setPickedLoc(picked);
                  setError(null);
                }}
              />
            ) : null}

            {stage === "urgency" && quote ? (
              <UrgencyView
                theme={theme}
                busy={busy}
                onPick={(kind) => void quoteState.pickUrgency(kind)}
              />
            ) : null}

            {stage === "pay" && quote ? (
              <PayView
                theme={theme}
                quote={quote}
                bankPay={payment.bankPay}
                busy={busy}
                onCopyNumber={payment.copyAccountNumber}
                cancelAsk={payment.cancelAsk}
                cancelBusy={payment.cancelBusy}
                setCancelAsk={payment.setCancelAsk}
                onCancel={(mode) => void payment.cancelPay(mode)}
              />
            ) : null}
          </div>
        )}

        {showFooter ? (
          <StepFooter
            stage={stage}
            isLight={isLight}
            isTextQuestion={screen?.kind === "text"}
            canContinueText={canAdvance(questions.draft)}
            onSubmitText={questions.submitText}
            bookingType={schedule.bookingType}
            hasSchedule={!!schedule.schedDate && !!schedule.schedTime}
            scheduleMismatch={
              !schedule.scheduleValid &&
              !!schedule.schedDate &&
              !!schedule.schedTime
            }
            onContinueSchedule={() => {
              if (!schedule.scheduleValid) {
                setError("Pick a time between now and 7 days ahead.");
                return;
              }
              setError(null);
              quoteState.goLocation();
            }}
            busy={busy}
            onSeePrice={() => void quoteState.confirmLocation()}
            onBack={goBack}
          />
        ) : null}
      </div>
    </>
  );
}
