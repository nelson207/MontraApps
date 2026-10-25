import type { NewsDto } from "@platform/api/generated/MontraPOSApi";
import type { NewsType } from "./newsTypesApi";

// Development-only stand-in for GET /api/news (and GET /api/news/types), used while the real
// call isn't usable (endpoint missing, or 401 without a real sign-in).
// Dates are relative to now so statuses (active / scheduled / expired) stay meaningful.

const daysFromNow = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString();
const image = (seed: string) => `https://picsum.photos/seed/montra-${seed}/1200/640`;

export const SAMPLE_NEWS_TYPES: NewsType[] = [
  { id: 1, name: "Campaigns" },
  { id: 2, name: "Compliance" },
  { id: 3, name: "General" },
  { id: 4, name: "Products" },
  { id: 5, name: "System" },
  { id: 6, name: "Training" },
];

/** The API serves images by id (GET /api/news/{id}/image); the sample links pictures directly */
export type SampleNews = NewsDto & { image?: string | null };

export const SAMPLE_NEWS: SampleNews[] = [
  {
    id: "sample-news-101",
    title: "New auto credit line with reduced rates",
    subtitle: "A lower TAN for new and used vehicles up to 84 months, available from today.",
    body:
      "We're launching a new auto credit line for new and used vehicles, with a reduced TAN for terms up to 84 months.\n\n" +
      "The new conditions apply to quotations created from today. Existing proposals keep the conditions they were created with.\n\n" +
      "Talk to your credit intermediary contact if you need help positioning the new line with your customers.",
    newsTypeId: 4, // Products
    validityBeginDate: daysFromNow(-1),
    validityEndDate: daysFromNow(60),
    image: image("auto"),
  },
  {
    id: "sample-news-102",
    title: "Spring campaign: zero opening fees",
    subtitle: "No opening fees on proposals submitted until the end of the month.",
    body:
      "During the spring campaign, proposals submitted until the end of the month have no opening fees.\n\n" +
      "The campaign is applied automatically in the credit summary; no extra steps are needed.",
    newsTypeId: 1, // Campaigns
    validityBeginDate: daysFromNow(-3),
    validityEndDate: daysFromNow(25),
    image: image("spring"),
  },
  {
    id: "sample-news-103",
    title: "Updated identification requirements",
    subtitle: "Customer identification documents now need to be validated before submission.",
    body:
      "Following the latest regulatory guidance, customer identification documents must be validated before a proposal is submitted.\n\n" +
      "Proposals without validated documents will be returned with a pending status.\n\n" +
      "The legal documents step in the intervention form shows what is missing.",
    newsTypeId: 2, // Compliance
    validityBeginDate: daysFromNow(-6),
    validityEndDate: null,
    image: null,
  },
  {
    id: "sample-news-104",
    title: "Scheduled maintenance on Saturday night",
    subtitle: "The platform will be unavailable between 01:00 and 03:00.",
    body:
      "To roll out performance improvements, Montra Credit will be unavailable on Saturday between 01:00 and 03:00.\n\n" +
      "Save any quotations in progress before that time.",
    newsTypeId: 5, // System
    validityBeginDate: daysFromNow(-2),
    validityEndDate: daysFromNow(5),
    image: image("servers"),
  },
  {
    id: "sample-news-105",
    title: "Training: getting the most out of quotations",
    subtitle: "A 45-minute online session for vendors and supervisors.",
    body:
      "Join a short online session covering simulations, comparing conditions and turning quotations into proposals.\n\n" +
      "Seats are limited; ask your supervisor to register your team.",
    newsTypeId: 6, // Training
    validityBeginDate: daysFromNow(-9),
    validityEndDate: daysFromNow(14),
    image: image("training"),
  },
  {
    id: "sample-news-106",
    title: "Faster proposal decisions for returning customers",
    subtitle: "Pre-approved customers now get decisions in minutes.",
    body:
      "Customers with a good payment history are now pre-approved, which speeds up decisions on new proposals.\n\n" +
      "Look for the pre-approved badge on the customer details step.",
    newsTypeId: 4, // Products
    validityBeginDate: daysFromNow(-12),
    validityEndDate: daysFromNow(90),
    image: image("handshake"),
  },
  {
    id: "sample-news-107",
    title: "New supplier onboarding in the North region",
    subtitle: "Twelve new suppliers joined the network this month.",
    body: "Twelve new suppliers in Porto, Braga and Guimarães joined the network. They're available in the supplier lists from today.",
    newsTypeId: 3, // General
    validityBeginDate: daysFromNow(-15),
    validityEndDate: null,
    image: image("porto"),
  },
  {
    id: "sample-news-108",
    title: "Winter campaign results",
    subtitle: "Thank you for a record-breaking winter campaign.",
    body: "The winter campaign closed with record results across all regions. Thank you to every vendor involved.",
    newsTypeId: 1, // Campaigns
    validityBeginDate: daysFromNow(-120),
    validityEndDate: daysFromNow(-60),
    image: image("winter"),
  },
  {
    id: "sample-news-109",
    title: "Two-factor authentication becomes mandatory",
    subtitle: "Starting next month, every user must sign in with two-factor authentication.",
    body:
      "To protect customer data, two-factor authentication will be mandatory for all users starting next month.\n\n" +
      "You can set it up now in Settings → Security.",
    newsTypeId: 2, // Compliance
    validityBeginDate: daysFromNow(10),
    validityEndDate: null,
    image: null,
  },
  {
    id: "sample-news-110",
    title: "Equipment catalogue update",
    subtitle: "Brands, models and versions were refreshed with this year's vehicles.",
    body: "The equipment catalogue now includes this year's models and versions. Older versions remain available for used vehicles.",
    newsTypeId: 5, // System
    validityBeginDate: daysFromNow(-20),
    validityEndDate: daysFromNow(40),
    image: image("cars"),
  },
  {
    id: "sample-news-111",
    title: "Holiday opening hours for support",
    subtitle: "Support will run with reduced hours during the holidays.",
    body: "Our support team will be available from 10:00 to 16:00 during the holiday period.",
    newsTypeId: 3, // General
    validityBeginDate: daysFromNow(-200),
    validityEndDate: daysFromNow(-170),
    image: null,
  },
  {
    id: "sample-news-112",
    title: "Insurance options added to proposals",
    subtitle: "Credit protection insurance can now be added directly in the credit summary.",
    body:
      "You can now add credit protection insurance to a proposal from the credit summary step.\n\n" +
      "The monthly payment shown already includes the insurance premium.",
    newsTypeId: 4, // Products
    validityBeginDate: daysFromNow(-25),
    validityEndDate: null,
    image: image("umbrella"),
  },
];

/** The sample as GET /api/news/search answers it: every news, newest first, searched and paged */
export function sampleNewsSearch(params: { search?: string; newsTypeId?: number; page: number; pageSize: number }) {
  const text = params.search?.toLowerCase();
  const matching = SAMPLE_NEWS.filter(
    (n) =>
      (!params.newsTypeId || n.newsTypeId === params.newsTypeId) &&
      (!text || [n.title, n.subtitle, n.body].some((field) => field?.toLowerCase().includes(text))),
  ).sort((a, b) => (b.validityBeginDate ?? "").localeCompare(a.validityBeginDate ?? ""));
  const start = (params.page - 1) * params.pageSize;
  return {
    items: matching.slice(start, start + params.pageSize),
    page: params.page,
    pageSize: params.pageSize,
    totalCount: matching.length,
  };
}
