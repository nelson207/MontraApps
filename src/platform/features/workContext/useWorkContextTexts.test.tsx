// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { useTranslation } from "react-i18next";
import { afterEach, describe, expect, it } from "vitest";
import { setLanguage } from "@platform/i18n/i18n";
import { useWorkContextTexts } from "./useWorkContextTexts";

afterEach(async () => {
  cleanup();
  await setLanguage("en");
});

function Texts() {
  const texts = useWorkContextTexts();
  const { t } = useTranslation("workContext");
  return (
    <ul>
      <li>{texts.label("organization")}</li>
      <li>{t("choose", { level: texts.name("member") })}</li>
      <li>{t("all", { levels: texts.plural("unit") })}</li>
      <li>{texts.purpose}</li>
    </ul>
  );
}

const texts = () => screen.getAllByRole("listitem").map((li) => li.textContent);

describe("working context texts (Montra Credit)", () => {
  it("English: the app's WORK_CONTEXT", () => {
    render(<Texts />);
    expect(texts()).toEqual(["Credit intermediary", "Choose a vendor", "All suppliers", "Default values for new quotations and proposals."]);
  });

  it("Portuguese: the app's messages", async () => {
    render(<Texts />);
    await act(() => setLanguage("pt-PT"));
    expect(texts()).toEqual([
      "Intermediário de crédito",
      "Escolha o vendedor",
      "Todos os fornecedores",
      "Valores por omissão para novas simulações e propostas.",
    ]);
  });
});
