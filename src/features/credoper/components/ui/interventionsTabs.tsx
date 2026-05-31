import { useState } from "react";
import { InterventionsSection } from "./interventionsSection";
import {
  selectCredoper,
  useAppDispatch,
  useAppSelector,
} from "../../../../app/store";
import { MontraPOSApi } from "../../../../services/api/generated/MontraPOSApi";
import { setCredoper } from "../../credoperSlice";

export default function InterventionsTabs() {
  const dispatch = useAppDispatch();
  const credoper = useAppSelector(selectCredoper);
  const [activeId, setActiveId] = useState<number>(0);

  const handleClick = (id: number) => {
    setActiveId(id);
    //onSelect?.(id.toString());
  };

  const addNewIntervention = async () => {
    if (!credoper) return;

    try {
      const newInterv = await dispatch(
        MontraPOSApi.endpoints.getApiCreditOperationsGetNewIntervGuarantor.initiate(),
      ).unwrap();

      if (newInterv && credoper) {
        const updatedInterventions = [
          ...(credoper.interventions ?? []),
          newInterv,
        ];

        dispatch(
          setCredoper({
            ...credoper,
            interventions: updatedInterventions,
          }),
        );
      }
    } catch (error) {
      console.error("Failed to add intervention", error);
    }
  };

  return (
    <>
      {/* Tabs */}
      <nav className="nav nav-pills nav-justified">
        {credoper?.interventions?.map((intervention, index) => (
          <a
            className={`nav-link ${index === activeId ? "active" : ""}`}
            aria-current="page"
            href="#"
            onClick={() => handleClick(index)}
          >
            {intervention.credOperIntervType === 4
              ? "Guarantor"
              : intervention.credOperIntervType === 2
                ? "Second Holder"
                : "Customer"}
          </a>
        ))}

        <button
          className="btn btn-secondary mt-3"
          onClick={() => addNewIntervention()}
        >
          Add Intervention
        </button>
      </nav>

      <div className="border rounded p-3">
        <InterventionsSection
          index={activeId}
          intervention={credoper?.interventions?.[activeId]}
        />
      </div>
    </>
  );
}
