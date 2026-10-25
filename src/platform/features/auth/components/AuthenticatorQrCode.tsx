import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";

type Props = {
  authenticatorUri: string;
  manualEntryKey?: string | null;
};

// "JBSWY3DPEHPK3PXP" -> "JBSW Y3DP EHPK 3PXP" (easier to type by hand)
const groupKey = (key: string) => key.replace(/\s+/g, "").replace(/(.{4})/g, "$1 ").trim();

export function AuthenticatorQrCode({ authenticatorUri, manualEntryKey }: Props) {
  const [copied, setCopied] = useState(false);

  const copyKey = async () => {
    if (!manualEntryKey) return;
    try {
      await navigator.clipboard.writeText(manualEntryKey.replace(/\s+/g, ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable (e.g. non-HTTPS); the key is still selectable
    }
  };

  return (
    <div className="d-flex flex-column align-items-center gap-3">
      <div className="bg-white border rounded-3 p-3">
        <QRCodeSVG
          value={authenticatorUri}
          size={180}
          title="Authenticator QR code"
        />
      </div>

      {manualEntryKey && (
        <div className="w-100 text-center">
          <div className="small text-body-secondary mb-1">
            Can't scan? Enter this key manually:
          </div>
          <div className="input-group input-group-sm">
            <input
              type="text"
              className="form-control font-monospace text-center"
              value={groupKey(manualEntryKey)}
              readOnly
              aria-label="Manual setup key"
              onFocus={(e) => e.currentTarget.select()}
            />
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={copyKey}
              aria-label="Copy setup key"
            >
              <i className={`bi ${copied ? "bi-check2" : "bi-copy"}`} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
