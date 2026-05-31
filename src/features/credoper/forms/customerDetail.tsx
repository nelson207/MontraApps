import IntlTelInput from "intl-tel-input/react";
import "intl-tel-input/build/css/intlTelInput.css";
import SelectField from "../../../components/ui/selectField";
import InputField from "../../../components/ui/inputField";
import {
  setCredOperField,
  setCustomerVATField,
  setEmailField,
  setLandLinePhoneField,
  setMobilePhoneField,
} from "../utils/functions";
import { selectCredoper, useAppSelector } from "../../../app/store";
import { getFieldMetadata } from "../../../utils/fieldMetadata";
import type { QuotationDataProps } from "../types/credoperTypes";

function CustomerDetail({ dispatchCredOper }: QuotationDataProps) {
  const credoper = useAppSelector(selectCredoper);
  return (
    <>
      <div className="row g-3 align-items-end my-2">
        <div className="col-md-4">
          <SelectField
            label="Credit Intermediary"
            id="credoper.creditIntermediaryStructNode"
            value={credoper?.creditIntermediaryStructNode ?? undefined}
            options={[
              { value: "pt", label: "Portugal" },
              { value: "es", label: "Spain" },
              { value: "fr", label: "France" },
            ]}
            onChange={(e) =>
              setCredOperField(
                dispatchCredOper,
                "creditIntermediaryStructNode",
                Number(e.target.value),
              )
            }
          />
        </div>
        <div className="col-md-4">
          <SelectField
            label="Showroom"
            id="credoper.showroom"
            value={credoper?.showRoomStructNode ?? undefined}
            options={[
              { value: "pt", label: "Portugal" },
              { value: "es", label: "Spain" },
              { value: "fr", label: "France" },
            ]}
            onChange={(e) =>
              setCredOperField(
                dispatchCredOper,
                "showRoomStructNode",
                Number(e.target.value),
              )
            }
          />
        </div>
        <div className="col-md-4">
          <SelectField
            label="Salesperson"
            id="credoper.salesperson"
            value={credoper?.salePersonStructNode ?? undefined}
            options={[
              { value: "pt", label: "Portugal" },
              { value: "es", label: "Spain" },
              { value: "fr", label: "France" },
            ]}
            onChange={(e) =>
              setCredOperField(
                dispatchCredOper,
                "salePersonStructNode",
                Number(e.target.value),
              )
            }
          />
        </div>
      </div>
      <div className="row g-3 align-items-end my-2">
        <div className="col-md-8">
          <InputField
            label="Customer Name"
            id="credoper.customerName"
            type="text"
            placeholder="Input Name"
            required={
              getFieldMetadata(credoper?.metadataResponse, "customerName")
                ?.isRequired ?? false
            }
            visible={
              getFieldMetadata(credoper?.metadataResponse, "customerName")
                ?.isVisible ?? true
            }
            value={credoper?.customerName ?? undefined}
            onChange={(e) =>
              setCredOperField(dispatchCredOper, "customerName", e.target.value)
            }
          />
        </div>
        <div className="col-md-4">
          <InputField
            label="Fiscal Number"
            id="credoper.fiscalNumber"
            type="text"
            placeholder="Input Fiscal Number"
            value={credoper?.customerVAT?.legalDocNumber ?? undefined}
            onChange={(e) =>
              setCustomerVATField(
                dispatchCredOper,
                credoper,
                "legalDocNumber",
                e.target.value,
              )
            }
          />
        </div>
      </div>
      <div className="row g-3 align-items-end my-2">
        <div className="col-md-6">
          <InputField
            label="Customer Email"
            id="credoper.customerEmail"
            type="email"
            value={credoper?.customerEmail?.email ?? undefined}
            onChange={(e) =>
              setEmailField(dispatchCredOper, credoper, "email", e.target.value)
            }
            inputGroupSpan="@"
          />
        </div>
        <div className="col-md-3">
          <label className="sr-only" htmlFor="credoper.customerPhone">
            Mobile Phone
          </label>
          <div id="credoper.customerPhone">
            <IntlTelInput
              onChangeNumber={(e) =>
                setMobilePhoneField(
                  dispatchCredOper,
                  credoper,
                  "phoneNumber",
                  e,
                )
              }
              initialValue={credoper?.customerPhone?.phoneNumber ?? undefined}
              // onChangeValidity={setIsValid}
              // onChangeErrorCode={setErrorCode}
              initOptions={{
                separateDialCode: true,
                autoPlaceholder: "polite",
                placeholderNumberType: "MOBILE",
                formatAsYouType: true,
                initialCountry: "pt",
                countryOrder: ["pt", "es", "fr", "de", "gb"],
                loadUtils: () => import("intl-tel-input/utils"),
              }}
              // inputProps={{
              //   onBlur: () => setShowValidation(true),
              // }}
            />
          </div>
        </div>
        <div className="col-md-3">
          <label className="sr-only" htmlFor="credoper.customerLandlinePhone">
            Landline Phone
          </label>
          <div id="credoper.customerLandlinePhone">
            <IntlTelInput
              onChangeNumber={(e) =>
                setLandLinePhoneField(
                  dispatchCredOper,
                  credoper,
                  "phoneNumber",
                  e,
                )
              }
              initialValue={
                credoper?.customerLandLine?.phoneNumber ?? undefined
              }
              // onChangeValidity={setIsValid}
              // onChangeErrorCode={setErrorCode}
              initOptions={{
                separateDialCode: true,
                autoPlaceholder: "polite",
                placeholderNumberType: "FIXED_LINE",
                formatAsYouType: true,
                initialCountry: "pt",
                countryOrder: ["pt", "es", "fr", "de", "gb"],
                loadUtils: () => import("intl-tel-input/utils"),
              }}
              // inputProps={{
              //   onBlur: () => setShowValidation(true),
              // }}
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default CustomerDetail;
