/**
 * Identity information for the chat runtime.
 * Supports authentication tokens and custom identity fields.
 */
export type ChatIdentity = {
  /** Optional bearer token for API authentication */
  authToken?: string | null;
  /** Optional user identifier */
  user_id?: string | null;
  /** Optional organization identifier */
  org_id?: string | null;
  /** Allow additional custom identity fields */
  [key: string]: any;
};