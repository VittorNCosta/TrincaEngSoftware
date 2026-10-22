// Original UI copy uses Portuguese and the ODS12 application state.
export const msg = (
  text: string,
  parameters: Record<string, string | number> = {},
) =>
  text.replace(/\{([^}]+)\}/g, (token, key: string) =>
    String(parameters[key] ?? token),
  );
