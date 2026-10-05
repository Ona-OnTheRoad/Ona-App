"use client";

import { AdminGuideBanner } from "@/components/admin/admin-guide-banner";
import { DetailPanel } from "@/components/admin/payments-manage/detail-panel";
import { OpsCards } from "@/components/admin/payments-manage/ops-cards";
import { PasswordPanel } from "@/components/admin/payments-manage/password-panel";
import { PaymentsList } from "@/components/admin/payments-manage/payments-list";
import { styles } from "@/components/admin/payments-manage/styles";
import { usePaymentsConsole } from "@/components/admin/payments-manage/use-payments-console";

export default function PaymentManagementPage() {
  const {
    router,
    authed,
    adminName,
    adminRole,
    payments,
    ops,
    opsError,
    loading,
    error,
    setError,
    msg,
    setMsg,
    busy,
    filter,
    setFilter,
    selectedId,
    setSelectedId,
    detail,
    setDetail,
    detailLoading,
    note,
    setNote,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    pendingAction,
    setPendingAction,
    canCancel,
    canForce,
    canRetry,
    loadPayments,
    loadDetail,
    withPassword,
    runAction,
    filtered,
    counts,
    esc,
    meta,
    alreadyPaid,
  } = usePaymentsConsole();

  if (!authed)
    return (
      <div style={{ padding: 40, fontFamily: "system-ui, sans-serif" }}>
        <p>Authenticating...</p>
      </div>
    );

  return (
    <div style={styles.container}>
      <div
        style={{
          ...styles.flex,
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={styles.header}>Payment Management</h1>
          <p style={styles.sub}>
            Full control: payments, force payout, refund, cancel {adminName} (
            {adminRole})
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            style={styles.btn}
            onClick={() => {
              void loadPayments();
              setMsg("Refreshed");
              setTimeout(() => setMsg(null), 2000);
            }}
          >
            Refresh
          </button>
          <button
            style={{ ...styles.btn, color: "#6b7280" }}
            onClick={() => router.push("/admin")}
          >
            Back to Admin
          </button>
        </div>
      </div>

      <AdminGuideBanner pageId="payments-manage" />

      {error ? <div style={styles.error}>{error}</div> : null}
      {msg ? <div style={styles.success}>{msg}</div> : null}

      {showPassword && (
        <PasswordPanel
          password={password}
          setPassword={setPassword}
          busy={busy}
          pendingAction={pendingAction}
          withPassword={withPassword}
          onCancel={() => {
            setShowPassword(false);
            setPendingAction(null);
          }}
        />
      )}

      <OpsCards ops={ops} />

      {opsError ? (
        <p style={{ ...styles.error, marginBottom: 16 }}>
          Balances unavailable: {opsError}
        </p>
      ) : null}

      <div style={{ display: "flex", gap: selectedId ? 16 : 0 }}>
        <PaymentsList
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          filter={filter}
          setFilter={setFilter}
          counts={counts}
          filtered={filtered}
          payments={payments}
          loading={loading}
        />

        {selectedId && (
          <DetailPanel
            selectedId={selectedId}
            detail={detail}
            detailLoading={detailLoading}
            esc={esc}
            meta={meta}
            alreadyPaid={alreadyPaid}
            busy={busy}
            canCancel={canCancel}
            canForce={canForce}
            canRetry={canRetry}
            note={note}
            setNote={setNote}
            setError={setError}
            loadDetail={loadDetail}
            runAction={runAction}
            onClose={() => {
              setSelectedId(null);
              setDetail(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
