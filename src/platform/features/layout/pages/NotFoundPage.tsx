import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { DEFAULT_MODULE_PATH } from "@app/modules";

function NotFoundPage() {
  const { t } = useTranslation("layout");
  return (
    <div className="text-center py-5">
      <i className="bi bi-compass display-3 text-primary" />
      <h2 className="h4 mt-3">{t("notFound.title")}</h2>
      <p className="text-body-secondary">
        {t("notFound.text")}
      </p>
      <Link to={DEFAULT_MODULE_PATH} className="btn btn-primary">
        {t("notFound.back")}
      </Link>
    </div>
  );
}

export default NotFoundPage;
