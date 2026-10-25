import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import {
  useGetApiCompaniesCountriesQuery,
  useGetApiUsersMeContactDetailsQuery,
  useGetApiUsersMeQuery,
  usePutApiUsersMeContactDetailsMutation,
  type UserContactsDto,
  type UserDetailsDto,
} from "@platform/api/generated/MontraPOSApi";
import { PROBLEM, problemCode, problemMessage } from "@platform/api/problemCode";
import { photoProblem, PHOTO_TYPES, useUploadMyPhotoMutation } from "../api/accountApi";
import {
  changedContacts,
  emailsToConfirm,
  toContactsDraft,
  validateContacts,
  type ContactsDraft,
} from "../contactDetails";
import ContactsEditor from "./ContactsEditor";

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : name.slice(0, 2)).toUpperCase() || "?";
}

function Spinner({ label }: { label: string }) {
  return (
    <div className="d-flex justify-content-center py-5">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">{label}</span>
      </div>
    </div>
  );
}

// The photo: checked in the browser (JPEG / PNG / WebP, up to 2 MB) before PUT /api/users/me/photo
function PhotoUpload({ name }: { name: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [upload, { isLoading, isSuccess, error, reset }] = useUploadMyPhotoMutation();

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const choose = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    reset();
    const why = photoProblem(file);
    setProblem(why);
    if (why) return;
    try {
      await upload(file).unwrap();
      setPreview(URL.createObjectURL(file));
    } catch {
      // shown below
    }
  };

  const message = problem ?? (error ? (problemMessage(error) ?? "Couldn't save the photo. Please try again.") : null);

  return (
    <div className="d-flex flex-column align-items-center gap-1">
      {preview ? (
        <img src={preview} alt="" className="app-avatar app-avatar-lg object-fit-cover p-0" />
      ) : (
        <span className="app-avatar app-avatar-lg">{initialsOf(name)}</span>
      )}
      <input
        ref={input}
        type="file"
        accept={PHOTO_TYPES.join(",")}
        className="d-none"
        onChange={(e) => void choose(e)}
        aria-label="Profile photo"
      />
      <button type="button" className="btn btn-sm btn-link p-0" onClick={() => input.current?.click()} disabled={isLoading}>
        {isLoading ? "Saving…" : "Change photo"}
      </button>
      <span className="visually-hidden" role="status">
        {isSuccess ? "Photo saved." : ""}
      </span>
      {message && (
        <div className="small text-danger text-center" role="alert" style={{ maxWidth: "10rem" }}>
          {message}
        </div>
      )}
    </div>
  );
}

function ProfileHeader({ me }: { me: UserDetailsDto | undefined }) {
  const name = me?.fullName?.trim() || me?.userName || "";
  return (
    <div className="card-header bg-body py-3 d-flex align-items-center gap-3">
      <PhotoUpload name={name} />
      <div className="overflow-hidden flex-grow-1">
        <h2 className="h5 mb-0 text-truncate">{name || "Your profile"}</h2>
        {me?.positionTitle && <div className="small text-body-secondary text-truncate">{me.positionTitle}</div>}
        <small className="text-body-secondary text-truncate d-block">
          {[me?.userName, me?.email].filter(Boolean).join(" · ")}
        </small>
      </div>
    </div>
  );
}

type SavedNotice = { emailsToConfirm: string[] } | null;

function ContactsForm({
  contacts,
  refetch,
  notice,
  onNotice,
}: {
  contacts: UserContactsDto;
  refetch: () => void;
  /** After a save: kept by the parent, so a reload of the contacts doesn't lose it */
  notice: SavedNotice;
  onNotice: (notice: SavedNotice) => void;
}) {
  // `saved` is the last server state: it moves forward on a successful save
  const [saved, setSaved] = useState<ContactsDraft>(() => toContactsDraft(contacts));
  const [draft, setDraft] = useState<ContactsDraft>(saved);
  const [submitted, setSubmitted] = useState(false);
  const [save, { isLoading, error, reset }] = usePutApiUsersMeContactDetailsMutation();
  const countries = useGetApiCompaniesCountriesQuery(undefined, { refetchOnMountOrArgChange: false });

  const request = changedContacts(saved, draft);
  const errors = validateContacts(draft);
  const isValid = Object.keys(errors).length === 0;

  const change = (next: ContactsDraft) => {
    setDraft(next);
    onNotice(null);
    if (error) reset();
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    if (!isValid || !request) return;
    const confirm = emailsToConfirm(saved, draft);
    try {
      const answer = await save({ updateMyContactsRequest: request }).unwrap();
      // The answer is the saved contacts (new items now have their ids); without one, reload them
      if (answer) {
        const next = toContactsDraft(answer);
        setSaved(next);
        setDraft(next);
      } else {
        refetch();
      }
      setSubmitted(false);
      onNotice({ emailsToConfirm: confirm });
    } catch {
      // shown below
    }
  };

  const discard = () => {
    setDraft(saved);
    setSubmitted(false);
    onNotice(null);
    reset();
  };

  return (
    <form className="card-body" onSubmit={handleSubmit} noValidate>
      {countries.isError && (
        <div className="alert alert-warning py-2" role="alert">
          {problemMessage(countries.error) ?? "Couldn't load the countries."}{" "}
          <button type="button" className="btn btn-sm btn-link p-0 align-baseline" onClick={() => void countries.refetch()}>
            Retry
          </button>
        </div>
      )}

      <ContactsEditor
        value={draft}
        onChange={change}
        errors={errors}
        showErrors={submitted}
        countries={countries.currentData}
        loadingCountries={countries.isFetching}
        idPrefix="profile"
      />

      {submitted && !isValid && (
        <div className="alert alert-danger d-flex gap-2 mt-4 mb-0" role="alert">
          <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" />
          <span>Some contacts need fixing before they can be saved.</span>
        </div>
      )}
      {!!error && (
        <div className="alert alert-danger d-flex gap-2 mt-4 mb-0" role="alert">
          <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" />
          <span>
            {problemMessage(error, { [PROBLEM.validationFailed]: "The server didn't accept these contacts. Check them and try again." }) ??
              "Couldn't save your contacts. Please try again."}
          </span>
        </div>
      )}
      {notice && (
        <div className="alert alert-success d-flex gap-2 mt-4 mb-0" role="status">
          <i className="bi bi-check-circle-fill" aria-hidden="true" />
          <div>
            <div>Your contacts were saved.</div>
            {notice.emailsToConfirm.length > 0 && (
              <div className="small">
                Check your inbox to confirm this address: <strong>{notice.emailsToConfirm.join(", ")}</strong>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="d-flex flex-wrap align-items-center gap-2 mt-4 pt-3 border-top">
        <button type="submit" className="btn btn-primary" disabled={!request || isLoading}>
          {isLoading && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
          {isLoading ? "Saving…" : "Save changes"}
        </button>
        {request && (
          <button type="button" className="btn btn-outline-secondary" onClick={discard} disabled={isLoading}>
            Discard
          </button>
        )}
        {request && !isLoading && <small className="text-body-secondary ms-sm-2">You have unsaved changes.</small>}
      </div>
    </form>
  );
}

// Settings → Account: who you are (GET /api/users/me), your photo and your contacts
// (GET/PUT /api/users/me/contact-details). A user without a contact record (400
// user_has_no_entity) has no contacts form.
function ProfileSettings() {
  const me = useGetApiUsersMeQuery();
  const contacts = useGetApiUsersMeContactDetailsQuery();
  const [notice, setNotice] = useState<SavedNotice>(null);
  const noEntity = problemCode(contacts.error) === PROBLEM.userHasNoEntity;

  if (me.isLoading) return <Spinner label="Loading profile…" />;

  return (
    <div className="card border-0 shadow-sm">
      {me.isError ? (
        <div className="card-header bg-body py-3">
          <div className="alert alert-danger d-flex align-items-center gap-2 mb-0" role="alert">
            <span className="flex-grow-1">{problemMessage(me.error) ?? "Couldn't load your profile."}</span>
            <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => void me.refetch()}>
              Retry
            </button>
          </div>
        </div>
      ) : (
        <ProfileHeader me={me.currentData} />
      )}

      {contacts.isLoading ? (
        <Spinner label="Loading contacts…" />
      ) : noEntity ? (
        <div className="card-body">
          <div className="alert alert-info mb-0" role="status">
            Your user has no contact record
          </div>
        </div>
      ) : contacts.isError ? (
        <div className="card-body">
          <div className="alert alert-danger d-flex align-items-center gap-2 mb-0" role="alert">
            <span className="flex-grow-1">{problemMessage(contacts.error) ?? "Couldn't load your contacts."}</span>
            <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => void contacts.refetch()}>
              Retry
            </button>
          </div>
        </div>
      ) : (
        contacts.currentData && (
          <ContactsForm
            // A reload after saving (answer without a body) starts the form from the server again
            key={contacts.fulfilledTimeStamp}
            contacts={contacts.currentData}
            refetch={() => void contacts.refetch()}
            notice={notice}
            onNotice={setNotice}
          />
        )
      )}
    </div>
  );
}

export default ProfileSettings;
