import { getApiErrorMessage } from "@platform/utils/getApiErrorMessage";
import { useGetDocumentPdfMutation, type PdfArgs } from "../api/contractsApi";

/** Download a document's PDF: fetches it, saves it under its number, and tracks which one is loading */
export function usePdfDownload() {
  const [getPdf, state] = useGetDocumentPdfMutation();

  const download = async (document: PdfArgs) => {
    try {
      const { url, fileName } = await getPdf({ id: document.id, number: document.number }).unwrap();
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
    loadingId: state.isLoading ? state.originalArgs?.id : undefined,
    error: state.isError ? (getApiErrorMessage(state.error) ?? "The PDF couldn't be downloaded.") : null,
  };
}
