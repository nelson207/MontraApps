import type { InsuranceKind, InsuranceProtection, InsuranceType } from "./insuranceApi";

// Development-only stand-in for the insurance endpoints (spec §5).

export const SAMPLE_INSURANCE_TYPES: Record<InsuranceKind, InsuranceType[]> = {
  CreditProtection: [
    { id: 101, name: "Life & disability", description: "Pays the outstanding balance on death or permanent disability." },
    { id: 102, name: "Unemployment", description: "Covers up to 12 instalments after involuntary unemployment." },
    { id: 103, name: "Complete protection", description: "Life, disability, unemployment and temporary incapacity." },
  ],
  Car: [
    { id: 201, name: "Third-party liability", description: "Mandatory liability cover." },
    { id: 202, name: "Comprehensive", description: "Own damage, theft, fire and glass." },
    { id: 203, name: "Comprehensive plus", description: "Comprehensive with replacement vehicle and assistance." },
  ],
};

const protection = (id: number, name: string, description: string, mandatory = false): InsuranceProtection => ({
  id,
  name,
  description,
  mandatory,
});

export const SAMPLE_PROTECTIONS: Record<number, InsuranceProtection[]> = {
  201: [
    protection(1, "Civil liability", "Damage caused to third parties.", true),
    protection(2, "Legal protection", "Legal costs after an accident."),
    protection(3, "Roadside assistance", "Towing and help on the road."),
    protection(4, "Occupants", "Injuries to the car's occupants."),
  ],
  202: [
    protection(1, "Civil liability", "Damage caused to third parties.", true),
    protection(5, "Own damage", "Collision and overturning."),
    protection(6, "Theft and robbery", "Theft of the vehicle or its parts."),
    protection(7, "Fire", "Fire, lightning and explosion."),
    protection(8, "Glass breakage", "Windscreen and windows."),
  ],
  203: [
    protection(1, "Civil liability", "Damage caused to third parties.", true),
    protection(5, "Own damage", "Collision and overturning.", true),
    protection(6, "Theft and robbery", "Theft of the vehicle or its parts."),
    protection(9, "Replacement vehicle", "Up to 15 days while yours is repaired."),
    protection(3, "Roadside assistance", "Towing and help on the road."),
    protection(10, "Natural phenomena", "Storms, floods and earthquakes."),
  ],
};
