# Ona Customer Care guide

**Who this is for:** Customer Care, Support, Super Admin  
**Where:** https://ona-backend.vercel.app/admin or https://ona-mi.vercel.app/admin (local: http://localhost:3000/admin)  
**Sensitive-unlock password:** set per deployment (`ADMIN_SENSITIVE_PASSWORD`); ask your Super Admin. It is never written in this guide.  

If the site says **“This deployment is temporarily paused”**, that is a Vercel account/usage block — not a bad Care login. Use local admin or fix Vercel usage (see `docs/VERCEL_DEPLOY.md`).

---

## Daily workflow (2 minutes)

1. Log in at `/admin/login` with your staff email + password.
2. You land on **Care desk** (`/admin`).
3. **Unlock sensitive mode** when you need money/freeze/PII:
   - Enter the sensitive-unlock password → Unlock
   - Stays open about **3 minutes** (`SENSITIVE_UNLOCK_TTL_MS`), then locks again
4. **Search** phone, name, job ID, or plate number.
5. **Open** a job from search or the live board.
6. Use one-click buttons:
   - **Release escrow** → pay Repair Pro (87.5%) + platform (5%) + VAT (7.5%) of the total
   - **Refund motorist** → full refund path
   - **Dispute → pay pro / refund** → final dispute decision
   - **Freeze / Unfreeze** motorist or pro
7. Check **Audit trail** if someone asks “who did what?”

---

## Sensitive actions (always need the unlock password)

| Action | Why locked |
|--------|------------|
| Escrow release | Moves money to pro |
| Escrow refund | Returns money to motorist |
| Freeze / unfreeze user | Blocks app access |
| Dispute / appeal final decision | Ends locked funds |
| View full NIN / BVN / bank | PII |
| System settings changes | App-wide behaviour |

Support role can **view** jobs and search but **cannot** run money/freeze actions.

---

## Roles

| Role | Can do |
|------|--------|
| **Super Admin** | Everything + settings + role changes |
| **Customer Care** | Search, board, escrow, freeze, disputes, PII (with password) |
| **Support** | Search, board, audit view only |

Staff accounts use `profiles.role = admin` (panel access) and `profiles.admin_role` for the narrow role above.

---

## Job money flow (remember this)

```
Negotiating → Agreed → Paid/Booked → En Route → Arrived
→ In Progress → Completed → Satisfied → Released
```

- Money is **held in escrow** after **Paid/Booked**.
- On **Released**: **87.5% Repair Pro · 5% platform · 7.5% VAT**, calculated on the job total (labour + call-out). See `docs/RULES.md`.
- **Dispute / Appeal** keeps funds locked until Care decides.

---

## Search tips

- Phone: `0803…` or full international form  
- Name: partial OK (`Ade`, `Chukw`)  
- Job ID: full UUID from app or SMS  
- Plate: motorist plate number  

---

## Security you rely on

1. Staff login (Supabase auth)  
2. Role permissions  
3. Sensitive-unlock password for money / freeze / PII actions  
4. Short unlock window (about 3 minutes)  
5. **Idle** admin session timeout (currently 4 hours, `ADMIN_IDLE_TIMEOUT_MS` in `src/lib/server/modules/security.ts`)  
6. Rate limits on unlock + sensitive routes  
7. **Audit log** with action, staff ID, IP, job/user target  

---

## If something fails

| Message | What to do |
|---------|------------|
| Sensitive action locked | Enter the unlock password on the Care desk |
| Permission denied | Your role is Support — escalate to Care/Super Admin |
| Too many attempts | Wait 1–5 minutes; don’t share password |
| Job not found | Confirm UUID; try name/phone search |

---

## Escalation

- Payment stuck after “Satisfied” → Care desk → **Release escrow**  
- Fraud / abuse → **Freeze** user + note in audit reason  
- Unfair dispute → open **Disputes** page, review evidence, resolve with password  

**Never** share the unlock password in chat groups or with customers.
