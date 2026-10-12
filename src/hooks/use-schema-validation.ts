import { useState } from "react";
import { z } from "zod";

// Client-side half of "one schema, two checks". Pass the same Zod schema the
// server action uses; put `validate` on the form's onSubmit. Invalid input is
// stopped in the browser and never sent.
export function useSchemaValidation<TSchema extends z.ZodObject>(schema: TSchema) {
  type FieldErrors = Partial<Record<keyof z.output<TSchema>, string[]>>;
  const [clientErrors, setClientErrors] = useState<FieldErrors>();

  function validate(event: React.SubmitEvent<HTMLFormElement>) {
    const result = schema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    if (result.success) {
      setClientErrors(undefined);
      return;
    }
    event.preventDefault();
    setClientErrors(z.flattenError(result.error).fieldErrors);
  }

  return { clientErrors, validate };
}
