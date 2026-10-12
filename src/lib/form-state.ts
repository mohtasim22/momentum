// The shape every form action returns to its form through useActionState.
// TInput is the form's Zod input type, so field names are checked.
export type FormState<TInput> = {
  ok?: boolean;
  message?: string;
  formError?: string;
  fieldErrors?: Partial<Record<keyof TInput, string[]>>;
  values?: Partial<Record<keyof TInput, string>>;
};
