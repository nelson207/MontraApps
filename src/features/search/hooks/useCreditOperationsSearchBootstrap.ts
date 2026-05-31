import { usePostApiCreditOperationsSearchOperationsMutation } from "../../../services/api/generated/MontraPOSApi";

export default function useSearchBootstrap() {
  const [GetCreditOperationSearch, { isLoading: searchingCreditOperations }] =
    usePostApiCreditOperationsSearchOperationsMutation();

  return {
    GetCreditOperationSearch,
    searchingCreditOperations,
  };
}
