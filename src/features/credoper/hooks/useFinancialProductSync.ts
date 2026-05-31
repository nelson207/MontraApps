import { useEffect, useState } from "react";
import type {
  CredOperDto,
  FinancialProductDto,
} from "../../../services/api/generated/MontraPOSApi";
import { patchCredoper, updateConditionAt } from "../credoperSlice";
import { useAppDispatch } from "../../../app/store";
import useQuotationBootstrap from "./useQuotationBootstrap";

export default function useFinancialProductSync(
  credoper: CredOperDto | null,
  creoperStep: number | undefined,
) {
  const dispatch = useAppDispatch();
  const [financialProduct, setFinancialProduct] =
    useState<FinancialProductDto>();

  const { GetFinancialProductDetail, GetDefaultValuesFromFinancialProduct } =
    useQuotationBootstrap();

  useEffect(() => {
    const financialProductId = credoper?.financialProduct;

    if (!financialProductId) {
      return;
    }

    void GetFinancialProductDetail({
      financialProductDetailsRequest: {
        finProductId: financialProductId,
      },
    })
      .unwrap()
      .then(async (data) => {
        setFinancialProduct(data);
        const updatedCredoper = {
          ...credoper,
          aplCompanyId: data.aplCompanyId ?? 0,
          aplBusinessId: data.aplBusinessId ?? 0,
          currencyId: data.currencyId ?? null,
          finProductVersion: data.finProductVersion ?? 0,
          credOperTypeId: data.OperType ?? 0,
          credOperStep: creoperStep ?? 1,
          credOperChannelId: 1,
        };
        dispatch(patchCredoper(updatedCredoper));

        await GetDefaultValuesFromFinancialProduct({
          credOperDto: updatedCredoper,
        })
          .unwrap()
          .then((data) => {
            if (data != null) {
              console.log(data);
              dispatch(
                updateConditionAt({
                  index: 0,
                  changes: data.conditions?.at(0) ?? {},
                }),
              );
            }
          });
      });

    // void GetFinancialProductTermRestriction({
    //   credOperDto: credoper,
    // })
    //   .unwrap()
    //   .then((data) => {
    //     setTermRestrictions(data);
    //   });
  }, [credoper?.financialProduct]);

  return { financialProduct };
}
