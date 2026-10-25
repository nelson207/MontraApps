// News pictures for the session: GET /api/news/{id}/image needs the bearer token, so pictures are
// fetched as Blobs through the API client (newsApi getNewsImage) and kept here per news id.
// Components make their own object URL from the Blob and revoke it when they unmount or show
// another news (NewsImage). null = the news has no picture (404): remembered, never asked again.

const images = new Map<string, Blob | null>();

/** The picture of a news: a Blob, null (none), or undefined (not loaded yet) */
export const cachedNewsImage = (id: string): Blob | null | undefined => images.get(id);

export const rememberNewsImage = (id: string, image: Blob | null) => {
  images.set(id, image);
};

/** Forget every picture (sign-out, tests) */
export const clearNewsImages = () => images.clear();
