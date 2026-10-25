// Dev-only sample lists while the equipment endpoints can't be reached (never for an error the
// API answered, e.g. 502 backend_unavailable: that one is shown).

const option = (name: string) => ({ code: name.toUpperCase().replace(/\W+/g, ""), abbreviation: name, description: null });

const MODELS: Record<string, string[]> = {
  Peugeot: ["208", "2008", "308", "3008"],
  Renault: ["Clio", "Captur", "Mégane"],
  Volkswagen: ["Polo", "Golf", "T-Roc"],
  BMW: ["Série 1", "Série 3", "X1"],
};

export const SAMPLE_BRANDS = Object.keys(MODELS).map(option);

export const sampleModels = (brand: string) =>
  (Object.entries(MODELS).find(([name]) => option(name).code === brand)?.[1] ?? []).map(option);

const VERSIONS = ["1.2 PureTech Active", "1.2 PureTech Allure", "1.5 BlueHDi GT", "Hybrid 136 e-DCS6"];

export const sampleVersions = (model: string) => VERSIONS.map((v) => option(`${model} ${v}`));

const item = (id: number, abbreviation: string, description = abbreviation) => ({ id, abbreviation, description });

export const SAMPLE_TYPES = [
  item(1, "Passenger car", "Light passenger vehicle"),
  item(2, "Light commercial", "Light commercial vehicle"),
  item(3, "Motorcycle"),
];

export const SAMPLE_STATES = [1, 2, 3].map((code, i) => ({
  code,
  abbreviation: ["New", "Used", "Demonstration"][i],
  description: ["New", "Used", "Demonstration vehicle"][i],
}));

const SAMPLE_CATEGORIES: Record<number, ReturnType<typeof item>[]> = {
  1: [item(11, "City car"), item(12, "Compact"), item(13, "Saloon"), item(14, "SUV"), item(15, "Electric")],
  2: [item(21, "Van"), item(22, "Pick-up")],
  3: [item(31, "Scooter"), item(32, "Road")],
};

export const sampleCategories = (equipmentTypeId: number) => SAMPLE_CATEGORIES[equipmentTypeId] ?? [];
