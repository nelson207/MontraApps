import {
  selectCredoper,
  useAppDispatch,
  useAppSelector,
} from "../../../app/store";
import { usePostApiCreditOperationsCalculateOperationsMutation } from "../../../services/api/generated/MontraPOSApi";
import { setCredoper } from "../credoperSlice";

function CreditDetail() {
  const credoper = useAppSelector(selectCredoper);
  const dispatch = useAppDispatch();

  const [calculateOperations, { isLoading, data, error }] =
    usePostApiCreditOperationsCalculateOperationsMutation();

  const CalculateCredoper = async () => {
    if (!credoper) return;

    try {
      const result = await calculateOperations({
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
    <aside className="card shadow-sm border-0 rounded-4 p-4 credit-card">
      <div className="text-center mb-4">
        <span className="text-muted small">Montante financiado</span>
        <h3 className="fw-bold mb-0">
          {credoper?.amount?.toLocaleString("pt-PT")}€
        </h3>
      </div>

      <div className="bg-light rounded-4 p-3 mb-4 text-center">
        <span className="text-muted small">Prestação mensal</span>
        <div className="display-6 fw-bold">
          {credoper?.conditions
            ?.at(0)
            ?.flows?.at(0)
            ?.amount?.toLocaleString("pt-PT")}
          €<span className="fs-6 fw-normal text-muted"> / mês</span>
        </div>
      </div>

      <div className="row text-center mb-4">
        <div className="col-6">
          <div className="border rounded-4 py-3">
            <span className="text-muted small d-block">TAN</span>
            <strong className="fs-4">
              {credoper?.conditions
                ?.at(0)
                ?.implicitRate?.toFixed(2)
                .replace(".", ",")}
              %
            </strong>
          </div>
        </div>

        <div className="col-6">
          <div className="border rounded-4 py-3">
            <span className="text-muted small d-block">TAEG</span>
            <strong className="fs-4">
              {credoper?.conditions
                ?.at(0)
                ?.annualRate?.toFixed(2)
                .replace(".", ",")}
              %
            </strong>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <label className="form-label fw-semibold">Prazo</label>

        <div className="d-flex align-items-center justify-content-between border rounded-4 p-2">
          <button
            type="button"
            className="btn btn-outline-danger rounded-circle"
            //onClick={decreaseTerm}
            //disabled={term <= 12}
          >
            −
          </button>

          <div className="text-center">
            <strong className="fs-4">
              {credoper?.conditions?.at(0)?.term}
            </strong>
            <span className="d-block text-muted small">meses</span>
          </div>

          <button
            type="button"
            className="btn btn-outline-danger rounded-circle"
            //onClick={increaseTerm}
            //disabled={term >= 84}
          >
            +
          </button>
        </div>
      </div>

      <p className="text-muted small text-center mt-3 mb-0">
        Valores meramente indicativos. Sujeito a aprovação.
      </p>

      <button
        className="btn btn-primary"
        onClick={() => {
          CalculateCredoper();
        }}
      >
        {!isLoading && "Calculate"}
        {isLoading && "Calculating"}
      </button>
    </aside>
  );
}

export default CreditDetail;
