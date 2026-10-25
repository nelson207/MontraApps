import { getApiErrorMessage } from "@platform/utils/getApiErrorMessage";
import { useGetDocumentPdfMutation } from "../api/contractsApi";
import type { Contract, InvoiceDocument } from "../model/contracts";

/** Download a document's PDF: fetches it, saves it under its number, and tracks which one is loading */
export function usePdfDownload() {
  const [getPdf, state] = useGetDocumentPdfMutation();

  const download = async (contract: Contract, document: InvoiceDocument) => {
    try {
      const { url, fileName } = await getPdf({ contract, document }).unwrap();
      const link = window.document.createElement("a");
      link.href = url;
      link.download = fileName;
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      // Give the browser time to start the download before releasing the file
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch {
      // shown through `error`
    }
  };

  return {
    download,
    /** The document whose PDF is being fetched */
    loadingId: state.isLoading ? state.originalArgs?.document.id : undefined,
    error: state.isError ? (getApiErrorMessage(state.error) ?? "The PDF couldn't be downloaded.") : null,
    errorFor: state.isError ? state.originalArgs?.document.id : undefined,
  };
}
