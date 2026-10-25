// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { setLanguage } from "@platform/i18n/i18n";
import { useMenuText } from "./useModuleLabel";

afterEach(async () => {
  cleanup();
  await setLanguage("en");
});

function Menu() {
  const { moduleLabel, sectionLabel } = useMenuText();
  return (
    <ul>
      {["Home", "News", "Tasks", "Users", "Quotation", "Not translated"].map((label) => (
        <li key={label}>{moduleLabel({ label })}</li>
      ))}
      {["Overview", "Credit operations", "Administration"].map((section) => (
        <li key={section}>{sectionLabel(section)}</li>
      ))}
    </ul>
  );
}

const texts = () => screen.getAllByRole("listitem").map((li) => li.textContent);

describe("menu texts", () => {
  it("English: the labels as written in modules.ts", () => {
    render(<Menu />);
    expect(texts()).toEqual(["Home", "News", "Tasks", "Users", "Quotation", "Not translated", "Overview", "Credit operations", "Administration"]);
  });

  it("Portuguese: the app's own (app namespace) and the shared ones (layout namespace)", async () => {
    render(<Menu />);
    await act(() => setLanguage("pt-PT"));
    expect(texts()).toEqual([
      "Início",
      "Notícias",
      "Tarefas",
      "Utilizadores",
      "Simulação",
      "Not translated",
      "Visão geral",
      "Operações de crédito",
      "Administração",
    ]);
  });
});
