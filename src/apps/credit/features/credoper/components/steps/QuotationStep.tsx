import { selectCredoper, useAppSelector } from "@credit/store";
import { useBusinessChoices } from "../../business/useBusinessChoices";
import type { StepProps } from "../../wizard/stepTypes";
import QuotationSummaryCard from "../wizard/QuotationSummaryCard";

// A proposal made from a quotation, first step: the quotation it came from, read-only. The
// businesses are the wizard's (the same answer): they name its company, business and product.
function QuotationStep({ stage }: StepProps) {
  const op = useAppSelector(selectCredoper);
  const { data: businesses } = useBusinessChoices(stage, op);
  if (!op) return null;
  return <QuotationSummaryCard operation={op} businesses={businesses} />;
}

export default QuotationStep;
