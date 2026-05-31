import React, { useState } from "react";
import type {
  CreditOperationSearchRequest,
  CredOperDto,
} from "../../../services/api/generated/MontraPOSApi";
import useSearchBootstrap from "../hooks/useCreditOperationsSearchBootstrap";
import { useAppDispatch } from "../../../app/store";
import { setCredoper } from "../../credoper/credoperSlice";
import { useNavigate } from "react-router-dom";

function SearchOperations() {
  const [form, setForm] = useState<CreditOperationSearchRequest>();
  const [results, setResults] = useState<CredOperDto[]>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  // const [submittedFilters, setSubmittedFilters] =
  //   useState<CreditOperationSearchRequest>();

  const { GetCreditOperationSearch } = useSearchBootstrap();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    void GetCreditOperationSearch({
      creditOperationSearchRequest: form ?? {},
    })
      .unwrap()
      .then(async (data) => {
        setResults(data);
        console.log("Search results:", data);
      });
  };

  function handleResultClick(result: CredOperDto): void {
    dispatch(setCredoper(result));
    navigate("/quotation");
  }

  // const removeFilter = (key: keyof FormState) => {
  //   const updated = { ...submittedFilters, [key]: "" };
  //   setSubmittedFilters(updated);
  //   setForm((prev) => ({ ...prev, [key]: "" }));
  // };

  // const clearAllFilters = () => {
  //   setForm(undefined);
  //   setSubmittedFilters(undefined);
  // };

  // const appliedFilters = Object.entries(submittedFilters).filter(
  //   ([, value]) => value.trim() !== "",
  // );

  // const filteredResults = useMemo(() => {
  //   return mockResults.filter((item) => {
  //     const matchesCategory =
  //       !submittedFilters.category ||
  //       item.category === submittedFilters.category;

  //     const matchesStatus =
  //       !submittedFilters.status || item.status === submittedFilters.status;

  //     const matchesRegion =
  //       !submittedFilters.region ||
  //       item.city.toLowerCase().includes(submittedFilters.region.toLowerCase());

  //     const matchesKeyword =
  //       !submittedFilters.keyword ||
  //       item.name
  //         .toLowerCase()
  //         .includes(submittedFilters.keyword.toLowerCase());

  //     const matchesReference =
  //       !submittedFilters.reference ||
  //       item.code
  //         .toLowerCase()
  //         .includes(submittedFilters.reference.toLowerCase());

  //     const matchesOwner =
  //       !submittedFilters.owner ||
  //       item.owner.toLowerCase().includes(submittedFilters.owner.toLowerCase());

  //     return (
  //       matchesCategory &&
  //       matchesStatus &&
  //       matchesRegion &&
  //       matchesKeyword &&
  //       matchesReference &&
  //       matchesOwner
  //     );
  //   });
  // }, [submittedFilters]);

  return (
    <div className="py-4 search-page">
      <div className="card shadow-sm border-0 search-card">
        <div className="card-body p-4">
          <form onSubmit={handleSearch}>
            <div className="row g-3">
              <div className="col-md-4">
                <label htmlFor="category" className="form-label">
                  Business Category
                </label>
                <select
                  id="category"
                  name="category"
                  className="form-select"
                  value={form?.aplBusinessId ?? undefined}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      aplBusinessId: Number(e.target.value),
                    }))
                  }
                >
                  <option value="">Select category</option>
                  <option value="Retail">Retail</option>
                  <option value="Wholesale">Wholesale</option>
                  <option value="Services">Services</option>
                </select>
              </div>

              <div className="col-md-4">
                <label htmlFor="status" className="form-label">
                  Business Purpose Type
                </label>
                <select
                  id="status"
                  name="status"
                  className="form-select"
                  value={form?.aplBusinessPurposeTypeId ?? undefined}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      aplBusinessPurposeTypeId: Number(e.target.value),
                    }))
                  }
                >
                  <option value="">Select category</option>
                  <option value="Retail">Retail</option>
                  <option value="Wholesale">Wholesale</option>
                  <option value="Services">Services</option>
                </select>
              </div>

              <div className="col-md-4">
                <label htmlFor="region" className="form-label">
                  Company
                </label>
                <select
                  id="region"
                  name="region"
                  className="form-select"
                  value={form?.aplCompanyId ?? undefined}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      aplCompanyId: Number(e.target.value),
                    }))
                  }
                >
                  <option value="">Select region</option>
                  <option value="Lisbon">Lisbon</option>
                  <option value="Porto">Porto</option>
                  <option value="Braga">Braga</option>
                  <option value="Coimbra">Coimbra</option>
                  <option value="Faro">Faro</option>
                  <option value="Aveiro">Aveiro</option>
                </select>
              </div>

              <div className="col-md-4">
                <label htmlFor="keyword" className="form-label">
                  Credit Operation Channel ID
                </label>
                <input
                  id="keyword"
                  name="keyword"
                  type="text"
                  className="form-control"
                  placeholder="Enter keyword"
                  value={form?.credOperChannelId ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      credOperChannelId: Number(e.target.value),
                    }))
                  }
                />
              </div>

              <div className="col-md-4">
                <label htmlFor="reference" className="form-label">
                  Credit Operation Step
                </label>
                <input
                  id="reference"
                  name="reference"
                  type="text"
                  className="form-control"
                  placeholder="Enter reference"
                  value={form?.credOperStep ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      credOperStep: 1,
                    }))
                  }
                />
              </div>

              <div className="col-md-4">
                <label htmlFor="owner" className="form-label">
                  Owner
                </label>
                <input
                  id="owner"
                  name="owner"
                  type="text"
                  className="form-control"
                  placeholder="Enter owner"
                  value={form?.credOperTypeId ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      credOperTypeId: Number(e.target.value),
                    }))
                  }
                />
              </div>
            </div>

            <div className="d-flex gap-2 mt-4">
              <button type="submit" className="btn btn-primary px-4">
                Search
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary px-4"
                //onClick={clearAllFilters}
              >
                Clear
              </button>
            </div>
          </form>

          {/* {appliedFilters.length > 0 && (
            <div className="filters-applied mt-4">
              <div className="d-flex flex-wrap gap-2 align-items-center">
                <span className="fw-semibold me-2">Filters applied:</span>

                {appliedFilters.map(([key, value]) => (
                  <div key={key} className="filter-chip">
                    <span className="text-capitalize">
                      {key}: <strong>{value}</strong>
                    </span>
                    <button
                      type="button"
                      className="btn-close btn-close-sm"
                      aria-label={`Remove ${key}`}
                      onClick={() => removeFilter(key as keyof FormState)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )} */}
        </div>
      </div>

      <div className="results-section mt-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="mb-0">Results</h4>
          <span className="text-muted">{results?.length || 0} items found</span>
        </div>

        <div className="results-grid">
          {results && results.length > 0 ? (
            results.map((result) => (
              <div
                key={result.id}
                onClick={() => handleResultClick(result)}
                className="card result-card border-0 shadow-sm"
              >
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h5 className="card-title mb-0">{result.customerName}</h5>
                    <span className="badge text-bg-light">
                      {result.autUserStateId}
                    </span>
                  </div>

                  <div className="result-meta">
                    <p className="mb-1">
                      <strong>Number:</strong> {result.credOperNumber}
                    </p>
                    <p className="mb-1">
                      <strong>City:</strong> {result.financialProduct}
                    </p>
                    <p className="mb-1">
                      <strong>Code:</strong> {result.beginDate}
                    </p>
                    <p className="mb-0">
                      <strong>Owner:</strong>{" "}
                      {result.creditIntermediaryStructNode}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-12">
              <div className="alert alert-light border text-center mb-0">
                No results found.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default SearchOperations;
