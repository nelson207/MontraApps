import {
  selectCredoper,
  useAppDispatch,
  useAppSelector,
} from "../../../app/store";
import { usePostApiCreditOperationsSaveCredOperMutation } from "../../../services/api/generated/MontraPOSApi";
import { setCredoper } from "../credoperSlice";

function CreditSummary() {
  const credoper = useAppSelector(selectCredoper);
  const dispatch = useAppDispatch();

  const [saveOperations, { isLoading, data, error }] =
    usePostApiCreditOperationsSaveCredOperMutation();

  const SaveCredoper = async () => {
    if (!credoper) return;

    try {
      const result = await saveOperations({
        credOperDto: credoper,
      })
        .unwrap()
        .then((data) => {
          console.log("API response data:", data);
          dispatch(setCredoper(data));
        });

      console.log("API result:", result);
    } catch (err) {
      console.error("API error:", err);
    }
  };

  return (
    <>
      <div className="">
        <div className="card-body">
          <h5 className="card-title mb-4">Credit Operation Summary</h5>
          <div className="d-flex justify-content-between mb-2">
            <span>Customer Name</span>
            <strong>
              {credoper?.customerName || <span className="text-muted">-</span>}
            </strong>
          </div>
          <div className="d-flex justify-content-between mb-2">
            <span>Customer Email</span>
            <strong>
              {credoper?.customerEmail?.email || (
                <span className="text-muted">-</span>
              )}
            </strong>
          </div>
          <div className="d-flex justify-content-between mb-2">
            <span>Customer Phone</span>
            <strong>
              {credoper?.customerPhone?.phoneNumber || (
                <span className="text-muted">-</span>
              )}
            </strong>
          </div>
          <div className="d-flex justify-content-between mb-2">
            <span>Customer Landline Phone</span>
            <strong>
              {credoper?.customerLandLine?.phoneNumber || (
                <span className="text-muted">-</span>
              )}
            </strong>
          </div>
          <div className="d-flex justify-content-between mb-2">
            <span>Financed Amount</span>
            <strong>
              € {credoper?.assets?.at(0)?.baseAmount?.toLocaleString()}
            </strong>
          </div>

          <div className="d-flex justify-content-between mb-2">
            <span>Monthly Payment</span>
            <strong>
              €{" "}
              {credoper?.conditions
                ?.at(0)
                ?.flows?.at(0)
                ?.amount?.toLocaleString()}
            </strong>
          </div>

          <div className="d-flex justify-content-between mb-2">
            <span>Interest Rate</span>
            <span>{credoper?.conditions?.at(0)?.implicitRate}%</span>
          </div>

          <div className="d-flex justify-content-between mb-2">
            <span>Total Term</span>
            <span>{credoper?.conditions?.at(0)?.term} months</span>
          </div>

          <div className="d-flex justify-content-between mb-3">
            <span>Expenses / Fees</span>
            <span>€ {(0).toLocaleString()}</span>
          </div>

          <hr />

          <div className="d-flex justify-content-between">
            <span>Total Cost</span>
            <strong>€ {(0).toLocaleString()}</strong>
          </div>
        </div>
      </div>
      <div className="d-flex justify-content-end mt-3">
        <button
          className="btn btn-primary"
          onClick={() => {
            SaveCredoper();
          }}
        >
          {!isLoading && "Save"}
          {isLoading && "Saving..."}
        </button>
      </div>
    </>
  );
}

export default CreditSummary;
