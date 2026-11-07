import { Link } from "react-router-dom";
import { useFactoringText } from "../factoringText";
import { useBatchProgress, type AdvanceSubmission } from "../hooks/useAdvanceSubmission";
import { useFactoringFormat } from "../model/format";
import { factoringProblemMessage } from "../model/problems";
import { ApiMessages } from "./FactoringStates";

type Props = { submission: AdvanceSubmission; onFinished: () => void };

const ADVANCES_PATH = "/factoring/advances";

// Everything after the form. A batch is only called a failure when the API says so: then the form
// comes back as it was, and the next try is a new attempt. When the API can't tell, the list is
// what tells. An advance in an unknown state offers no way to request it again.
function AdvanceOutcome({ submission, onFinished }: Props) {
  const tx = useFactoringText();
  const { phase, attempt, lastError, retrying } = submission;
  const finish = () => {
    submission.finish();
    onFinished();
  };

  const toList = (
    <Link to={ADVANCES_PATH} className="btn btn-outline-secondary" onClick={finish}>
      {tx("advance.viewList", "View advances")}
    </Link>
  );

  if (phase === "accepted" && attempt?.accepted) return <BatchFollower submission={submission} toList={toList} onNew={finish} />;

  return (
    <div className="card shadow-sm border-0">
      <div className="card-body p-4 p-lg-5">
        {phase === "uncertain" ? (
          <>
            <h2 className="h5 mb-3">{tx("advance.uncertainTitle", "This advance may have started")}</h2>
            <p className="text-body-secondary">{tx("advance.uncertainBody", "Check the advances list before you request it again.")}</p>
            <ApiMessages messages={attempt?.messages} />
            {toList}
          </>
        ) : (
          <>
            <h2 className="h5 mb-3">{tx("submit.unansweredTitle", "There was no answer from the server")}</h2>
            <p className="text-body-secondary">
              {factoringProblemMessage(lastError, tx("advance.unansweredBody", "The advance may or may not have arrived."))}{" "}
              {tx("advance.unansweredSafe", "Sending it again is safe: it can't start a second advance.")}
            </p>
            <div className="d-flex flex-wrap gap-2">
              <button type="button" className="btn btn-primary" onClick={submission.retry} disabled={retrying || phase === "sending"}>
                {retrying && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
                {tx("submit.sendAgain", "Send again")}
              </button>
              {toList}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function BatchFollower({ submission, toList, onNew }: { submission: AdvanceSubmission; toList: React.ReactNode; onNew: () => void }) {
  const tx = useFactoringText();
  const { money, date } = useFactoringFormat();
  const { attempt } = submission;
  const { progress, followAgain } = useBatchProgress(attempt?.accepted?.batchId);
  if (!attempt) return null;
  const { summary } = attempt;

  const facts = (
    <p className="small text-body-secondary">
      {[summary.financialInstitution, summary.contractNumber, money(summary.amount, summary.currencyId), date(summary.valueDate)]
        .filter((part) => part !== null && part !== undefined && part !== "")
        .join(" · ")}
      {summary.invoiceNumbers.length > 0 && <span className="d-block">{summary.invoiceNumbers.join(", ")}</span>}
    </p>
  );

  return (
    <div className="card shadow-sm border-0">
      <div className="card-body p-4 p-lg-5" aria-live="polite">
        {progress.status === "processing" && (
          <>
            <div className="d-flex align-items-center gap-3 mb-3">
              <div className="spinner-border text-primary" role="status" aria-hidden="true" />
              <h2 className="h5 mb-0">{tx("advance.processing", "Processing the advance…")}</h2>
            </div>
            {facts}
            <p className="text-body-secondary mb-0">{tx("advance.processingBody", "This can take up to 2 minutes. You can leave this page: it carries on.")}</p>
          </>
        )}
        {progress.status === "stillProcessing" && (
          <>
            <h2 className="h5 mb-3">{tx("advance.stillProcessing", "The advance is still processing")}</h2>
            {facts}
            <p className="text-body-secondary">{tx("advance.stillProcessingBody", "It is taking longer than usual, which doesn't mean it failed. Check again here, or look for it in the advances list later.")}</p>
            <div className="d-flex flex-wrap gap-2">
              <button type="button" className="btn btn-primary" onClick={followAgain}>
                {tx("advance.checkAgain", "Check again")}
              </button>
              {toList}
            </div>
          </>
        )}
        {progress.status === "successful" && (
          <div className="text-center">
            <i className="bi bi-check-circle-fill text-success display-5" aria-hidden="true" />
            <h2 className="h4 mt-3 mb-2">{tx("advance.done", "Advance requested")}</h2>
            {facts}
            {progress.waitsForBackOffice && <p className="text-body-secondary">{tx("advance.waitsBackOffice", "It waits for back-office action.")}</p>}
            <ApiMessages messages={progress.messages} />
            <div className="d-flex flex-wrap justify-content-center gap-2">
              <button type="button" className="btn btn-primary" onClick={onNew}>
                <i className="bi bi-plus-lg me-2" aria-hidden="true" />
                {tx("advance.new", "New advance")}
              </button>
              {toList}
            </div>
          </div>
        )}
        {progress.status === "failed" && (
          <>
            <h2 className="h5 mb-3">{tx("advance.failedTitle", "The advance failed")}</h2>
            {facts}
            <ApiMessages messages={progress.messages} />
            <div className="d-flex flex-wrap gap-2">
              <button type="button" className="btn btn-primary" onClick={submission.finish}>
                <i className="bi bi-arrow-left me-2" aria-hidden="true" />
                {tx("advance.backToForm", "Back to the advance")}
              </button>
              {toList}
            </div>
          </>
        )}
        {progress.status === "unconfirmed" && (
          <>
            <h2 className="h5 mb-3">{tx("advance.unconfirmedTitle", "The advance couldn't be confirmed here")}</h2>
            {facts}
            <ApiMessages messages={progress.messages} />
            <p className="text-body-secondary">{tx("advance.unconfirmedBody", "Check the advances list to see whether it is there before you request it again.")}</p>
            <div className="d-flex flex-wrap gap-2">
              {toList}
              <button type="button" className="btn btn-ghost" onClick={onNew}>
                {tx("advance.new", "New advance")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AdvanceOutcome;
