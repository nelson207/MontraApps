type Props = {
  /** Why the last sign-in failed: password, Windows or Keycloak, whichever was tried last */
  failure: string | null;
  /** Why the page was opened (session expired, a step sent the user back) */
  notice: string | null;
};

// The login screen's one place for messages, last on the screen: one message at a time, the
// failure of the last attempt first, else the notice. It takes no room (it hangs below the form,
// over empty space), so the vertically centered form doesn't move when a message comes or goes.
function SignInMessage({ failure, notice }: Props) {
  if (!failure && !notice) return null;
  return (
    <div className="position-relative">
      <div className="position-absolute top-0 start-0 end-0">
        {failure ? (
          <div className="alert alert-danger d-flex align-items-start gap-2 py-2 mt-4" role="alert">
            <i className="bi bi-exclamation-triangle mt-1" aria-hidden="true" />
            <span>{failure}</span>
          </div>
        ) : (
          <div className="alert alert-warning d-flex align-items-center gap-2 py-2 mt-4" role="status">
            <i className="bi bi-clock-history" aria-hidden="true" />
            {notice}
          </div>
        )}
      </div>
    </div>
  );
}

export default SignInMessage;
