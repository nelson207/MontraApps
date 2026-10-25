import { useTranslation } from "react-i18next";

function PageLoader() {
  const { t } = useTranslation();
  return (
    <div className="d-flex justify-content-center align-items-center py-5">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">{t("loading")}</span>
      </div>
    </div>
  );
}

export default PageLoader;
