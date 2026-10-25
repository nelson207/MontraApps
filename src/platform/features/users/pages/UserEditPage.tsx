import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { skipToken } from "@reduxjs/toolkit/query";
import { useAppDispatch } from "@platform/app/store";
import {
  MontraPOSApi,
  useGetApiUsersByIdQuery,
  usePostApiUsersMutation,
  usePutApiUsersByIdMutation,
  type ManagedUserDto,
} from "@platform/api/generated/MontraPOSApi";
import { isInvalidId, PROBLEM, problemMessage } from "@platform/api/problemCode";
import { toContactsDraft, type ContactsDraft } from "@platform/features/account/contactDetails";
import { listUrl } from "@platform/hooks/listUrl";
import UserForm from "../components/UserForm";
import { EMPTY_USER_FORM, fromManagedUser, toCreateRequest, toUpdateRequest, type UserFormValues } from "../managedUser";

/** After saving: shown on the user's page (React Router location state) */
type UserFlash = { flash?: string };

function BackLink() {
  return (
    <Link to={listUrl("/admin/users")} className="link-secondary text-decoration-none small">
      <i className="bi bi-arrow-left me-1" aria-hidden="true" />
      Users
    </Link>
  );
}

function Flash({ text }: { text: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <div className="alert alert-success alert-dismissible d-flex gap-2 mb-0" role="status">
      <i className="bi bi-check-circle-fill" aria-hidden="true" />
      <span>{text}</span>
      <button
        type="button"
        className="btn-close"
        aria-label="Dismiss"
        onClick={() => navigate(location.pathname + location.search, { replace: true, state: null })}
      />
    </div>
  );
}

function NewUser() {
  const navigate = useNavigate();
  const [create, { isLoading, error }] = usePostApiUsersMutation();

  const save = async (values: UserFormValues) => {
    try {
      const user = await create({ createUserRequest: toCreateRequest(values) }).unwrap();
      const email = values.email.trim();
      const flash = `${user.fullName || user.userName} was created.${
        email ? ` The password was e-mailed to ${email}.` : " No e-mail was given, so no password was sent."
      }`;
      navigate(user.id ? `/admin/users/${encodeURIComponent(user.id)}` : listUrl("/admin/users"), {
        state: { flash } satisfies UserFlash,
      });
    } catch {
      // shown by UserForm via `error`
    }
  };

  return (
    <UserForm mode="create" initial={EMPTY_USER_FORM} submitLabel="Create user" isSaving={isLoading} error={error} onSubmit={save} />
  );
}

/** `id`: the route's, as the API gave it */
function EditUser({ id, user }: { id: string; user: ManagedUserDto }) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [update, { isLoading, error }] = usePutApiUsersByIdMutation();
  const saved = { values: fromManagedUser(user), contacts: toContactsDraft(user.contacts) };

  const save = async (values: UserFormValues, contacts: ContactsDraft) => {
    const request = toUpdateRequest(saved, { values, contacts });
    if (!request) return;
    try {
      const updated = await update({ id, updateUserRequest: request }).unwrap();
      // The answer is the saved user: the page shows it (no tags on the generated endpoints)
      dispatch(MontraPOSApi.util.upsertQueryData("getApiUsersById", { id }, updated));
      const emailChanged = !!request.emails;
      navigate(".", {
        replace: true,
        state: {
          flash: `${updated.fullName || updated.userName} was updated.${emailChanged ? " New or changed e-mail addresses get a confirmation link." : ""}`,
        } satisfies UserFlash,
      });
    } catch {
      // shown by UserForm via `error`
    }
  };

  return (
    <UserForm
      // A saved user (new answer) starts the form again from the server's values
      key={JSON.stringify(user)}
      mode="edit"
      initial={saved.values}
      initialContacts={saved.contacts}
      submitLabel="Save changes"
      isSaving={isLoading}
      error={error}
      isDirty={(values, contacts) => toUpdateRequest(saved, { values, contacts }) !== null}
      onSubmit={save}
    />
  );
}

// /admin/users/new and /admin/users/:userId (GET /api/users/{id}; ids are opaque, never parsed)
function UserEditPage() {
  const { userId } = useParams();
  const flash = (useLocation().state as UserFlash | null)?.flash;
  const id = userId ?? null;
  const userQuery = useGetApiUsersByIdQuery(id ? { id } : skipToken);

  let content;
  if (!id) {
    content = <NewUser />;
  } else if (userQuery.isLoading || (userQuery.isFetching && !userQuery.currentData)) {
    content = (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading user…</span>
        </div>
      </div>
    );
  } else if (!userQuery.currentData) {
    const message = isInvalidId(userQuery.error)
      ? // An old link whose id the API no longer recognises is just not found
        "User not found."
      : (problemMessage(userQuery.error, { [PROBLEM.userManagementForbidden]: "You can't manage this user" }) ??
        "Couldn't load the user.");
    content = (
      <div className="alert alert-warning mb-0" role="alert">
        {message}
      </div>
    );
  } else {
    content = <EditUser id={id} user={userQuery.currentData} />;
  }

  return (
    <div className="d-flex flex-column gap-3">
      <BackLink />
      {flash && <Flash text={flash} />}
      {content}
    </div>
  );
}

export default UserEditPage;
