import { createPortal } from "react-dom";

// Over the page while a new financial product's defaults load: its values (amounts, initial
// entry, term) are about to change, so nothing is typed or calculated meanwhile. In <body>, out
// of the page it blocks (made inert meanwhile).
function ProductDefaultsLoading() {
  return createPortal(
    <>
      <div className="modal fade show d-block" role="alertdialog" aria-modal="true" aria-busy="true" aria-labelledby="product-defaults-loading">
        <div className="modal-dialog modal-dialog-centered modal-sm">
          <div className="modal-content border-0 shadow-lg">
            <div className="modal-body p-4 text-center" role="status">
              <span className="spinner-border text-primary mb-3" aria-hidden="true" />
              <p id="product-defaults-loading" className="mb-0">
                Fetching the financial product's values…
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>,
    document.body,
  );
}

export default ProductDefaultsLoading;
