import { USERS_ACCESS } from "@app/users";
import { delay } from "@platform/api/devFallback";
import type { AdminUser, UsersPage, UsersQuery } from "./usersApi";

// Development-only, in-memory stand-in for the user list (placeholder endpoint), so users can be
// listed in the prototype. Viewing, creating and editing use the real API.

const FIRST = ["Ana", "João", "Marta", "Rui", "Carla", "Miguel", "Pedro", "Inês", "Tiago", "Sofia", "Luís", "Beatriz", "Nuno", "Rita", "Bruno", "Joana", "Diogo", "Catarina"];
const LAST = ["Silva", "Pereira", "Costa", "Santos", "Martins", "Alves", "Ferreira", "Rodrigues", "Gomes", "Lopes", "Marques", "Sousa", "Oliveira"];

const ascii = (text: string) => text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

function makeUser(i: number): AdminUser {
  const firstName = FIRST[i % FIRST.length];
  const lastName = LAST[(i * 7) % LAST.length];
  return {
    id: `sample-user-${i + 1}`,
    firstName,
    lastName,
    email: `${ascii(firstName)}.${ascii(lastName)}${i}@montra.example`,
    phoneNumber: `+3519${String(10000000 + i * 7919).slice(0, 8)}`,
    active: i % 9 !== 4,
    ...USERS_ACCESS.sample(i),
  };
}

const users: AdminUser[] = Array.from({ length: 57 }, (_, i) => makeUser(i));

export const sampleUsers = {
  async list({ search, filter, page, pageSize }: UsersQuery): Promise<UsersPage> {
    await delay(350);
    const term = ascii(search.trim());
    const matches = users.filter(
      (u) =>
        (!filter || USERS_ACCESS.filter.matches(u, filter)) &&
        (!term || ascii(`${u.firstName} ${u.lastName} ${u.email}`).includes(term)),
    );
    const sorted = [...matches].sort((a, b) =>
      `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`, "pt"),
    );
    const start = (page - 1) * pageSize;
    return { items: sorted.slice(start, start + pageSize), total: matches.length };
  },
};
