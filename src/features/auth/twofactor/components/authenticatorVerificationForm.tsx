// features/auth/twoFactor/components/AuthenticatorVerificationForm.tsx

type Props = {
  code: string;
  isLoading: boolean;
  isRegenerating: boolean;
  onCodeChange: (code: string) => void;
  onSubmit: () => void;
  onRegenerate: () => void;
};

export function AuthenticatorVerificationForm({
  code,
  isLoading,
  isRegenerating,
  onCodeChange,
  onSubmit,
  onRegenerate,
}: Props) {
  return (
    <>
      <input
        className="form-control mt-3"
        placeholder="Enter 6-digit code"
        value={code}
        maxLength={6}
        inputMode="numeric"
        autoComplete="one-time-code"
        onChange={(e) => onCodeChange(e.target.value.replace(/\D/g, ""))}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onSubmit();
          }
        }}
      />

      <button
        className="btn btn-primary mt-3"
        onClick={onSubmit}
        disabled={isLoading || code.length !== 6}
      >
        {isLoading ? "Verifying..." : "Verify"}
      </button>
      <button
        className="btn btn-primary mt-3 mx-2"
        onClick={onRegenerate}
        disabled={isRegenerating}
      >
        {isRegenerating ? "Regenerating..." : "Regenerate QR Code"}
      </button>
    </>
  );
}
