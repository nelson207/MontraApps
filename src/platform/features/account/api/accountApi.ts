import { emptySplitApi } from "@platform/api/emptyApi";

// My profile: GET /api/users/me (header), GET/PUT /api/users/me/contact-details and
// GET /api/companies/countries come from the generated MontraPOSApi.ts. The photo upload is
// here: the generated client sends its body as JSON, the API wants multipart (field `file`).

export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const PHOTO_MAX_BYTES = 2 * 1024 * 1024;

/** Why the file can't be sent as the photo, or null when it can (checked before uploading) */
export function photoProblem(file: Pick<File, "type" | "size">): string | null {
  if (!(PHOTO_TYPES as readonly string[]).includes(file.type)) return "Choose a JPEG, PNG or WebP image.";
  if (file.size > PHOTO_MAX_BYTES) return "The photo must be 2 MB or less.";
  return null;
}

const accountApi = emptySplitApi.injectEndpoints({
  endpoints: (build) => ({
    /** PUT /api/users/me/photo: 204 when saved */
    uploadMyPhoto: build.mutation<void, File>({
      query: (file) => {
        const body = new FormData();
        body.append("file", file);
        return { url: "/api/users/me/photo", method: "PUT", body };
      },
    }),
  }),
});

export const { useUploadMyPhotoMutation } = accountApi;
