// features/auth/twoFactor/components/AuthenticatorQrCode.tsx

import { QRCodeSVG } from "qrcode.react";

type Props = {
  authenticatorUri: string;
  manualEntryKey?: string | null;
};

export function AuthenticatorQrCode({
  authenticatorUri,
  manualEntryKey,
}: Props) {
  return (
    <div className="text-center">
      <QRCodeSVG value={authenticatorUri} size={220} />

      {manualEntryKey && (
        <p className="mt-3">
          Manual key: <strong>{manualEntryKey}</strong>
        </p>
      )}
    </div>
  );
}
