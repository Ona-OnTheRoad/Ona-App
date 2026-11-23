# Liveness head-movement challenges

## Goal

In the browser face check, head-movement challenges (nod, turn left/right, look up/down) did not register. Only smile and blink passed. Each failed session counted toward the local lockout (6 failures, then 1 minute), so Pros got locked out. Reported 2026-11-23 after the `/verify/tier-3` fix. The challenge runs in the browser with MediaPipe; Prembly only receives the final photo.

Cause: `headPose()` in `src/components/profile/face-liveness/helpers.ts` read the wrong elements of the facial transform. Its "yaw" was really roll (tilt toward a shoulder) and its "pitch" was really yaw. True pitch (nod) was never computed. Turning the head could pass a nod challenge; nodding could pass nothing.

The user approved this plan in the conversation:

1. Correct `headPose()` and unit test it with known rotations.
2. Measure head movement over a time window (1.5 s) instead of the last 18 frames, so a natural nod counts on slower phones.

Follow-up after the user's device test (2026-11-23), also approved:

3. Turn left/right were reported swapped. The previous code accepted a turn either way for both challenges, so turning right passed "turn left". The direction now comes from face landmarks (`headTurnSide`: nose tip versus the two face edges in the raw, unmirrored camera frame). The size still comes from `|yaw|`.
4. "Look slightly up" was barely detected. It was judged against the camera's level (pitch < about −7°). A phone held low already tilts the head down, so a slight look up never got there. Look up and look down now use a landmark tilt (`headTiltRatio`: nose between forehead and chin) measured against the person's own position in the last 1.5 s (`TILT_MIN` 0.02, about 6°). Nod also accepts that tilt range. The prompts now read "Tilt your head up/down".

## Expected change areas

- `src/components/profile/face-liveness/helpers.ts`: `headPose`, `headTurnSide`, `headTiltRatio`, `pushTimed`, `timedRange`, `timedExtent`, `POSE_WINDOW_MS`, `TURN_SIDE_MIN`, `TILT_MIN`.
- `src/components/profile/face-liveness/constants.ts`: look up/down prompt text.
- `src/components/profile/face-liveness/detection-tick.ts`, `use-face-liveness.ts`: yaw/pitch history is time-based.
- New `src/components/profile/face-liveness/__tests__/head-pose.test.ts`.
- No server, API or protected (`docs/RULES.md` §10) file is touched.

## Reviewer procedure

Check each item in [`liveness-head-pose.json`](liveness-head-pose.json) against the reviewed commit. Code and test evidence is kept apart from device evidence. Never mark an unrun check passed.

## Boundaries and limitations

- The matrix layout (column- or row-major) is not documented in the MediaPipe typings. The formulas assume column-major, but the challenges only use magnitudes and ranges, so either layout gives the same verdict (tested).
- The turn and tilt directions assume the frames MediaPipe receives are not mirrored (getUserMedia frames are not; only the preview is, by CSS). Unit tests encode that assumption. Only the device check (H1) proves it.
- Look up and look down compare against the last 1.5 s. Coming back to level after looking down can also count as "up". This is accepted: the gate is UX, and the server provider check is the authority.
- `TURN_SIDE_MIN` (0.06) and `TILT_MIN` (0.02) are estimates, not measured on devices.
- A session timeout still counts toward the local lockout. With the detection fixed this should be rare; revisit if device testing shows otherwise.
- Thresholds (turn about 10°, nod about 11° range) are unchanged and need tuning on real phones.

## Remaining work

- **Code:** independent review; tune `TURN_SIDE_MIN` / `TILT_MIN` from device results.
- **External:** device check (H1).

## Closeout

Not closed. Update `docs/BACKEND_FIXES_STATUS.md` when this merges.
