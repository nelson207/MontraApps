import Alert from "react-bootstrap/Alert";

type Props = {
  errorMessage: string | null;
  backCountdown: number | null;
};

function LoginErrorAlert({ errorMessage, backCountdown }: Props) {
  if (!errorMessage) return null;

  return (
    <Alert variant="danger" className="mt-4">
      {errorMessage}

      {backCountdown !== null && (
        <div className="mt-2">
          Returning to login in {backCountdown} seconds...
        </div>
      )}
    </Alert>
  );
}

export default LoginErrorAlert;
