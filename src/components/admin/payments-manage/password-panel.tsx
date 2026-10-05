import { styles } from "./styles";

type Props = {
  password: string;
  setPassword: (v: string) => void;
  busy: boolean;
  pendingAction: (() => Promise<void>) | null;
  withPassword: (action: () => Promise<void>) => Promise<void>;
  onCancel: () => void;
};

export function PasswordPanel({
  password,
  setPassword,
  busy,
  pendingAction,
  withPassword,
  onCancel,
}: Props) {
  return (
    <div
      style={{
        ...styles.panel,
        background: "#fffbeb",
        borderColor: "#fde68a",
        marginBottom: 16,
      }}
    >
      <p style={{ fontSize: 13, fontWeight: 600, marginTop: 0 }}>
        Sensitive action requires temporary access code
      </p>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          style={{ ...styles.input, width: 200 }}
          type="password"
          placeholder="Enter access code"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && pendingAction) {
              void withPassword(pendingAction);
            }
          }}
          autoFocus
        />
        <button
          style={styles.btnPrimary}
          disabled={busy}
          onClick={() => {
            if (pendingAction) void withPassword(pendingAction);
          }}
        >
          Confirm
        </button>
        <button style={styles.btn} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
