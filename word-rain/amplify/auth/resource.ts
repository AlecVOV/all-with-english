import { defineAuth } from '@aws-amplify/backend';

/**
 * Guest-only access: no login screen, students are identified by an
 * anonymous Cognito Identity Pool identityId. Unauthenticated identities
 * are free, so this keeps auth cost at zero.
 * https://docs.amplify.aws/nuxt/build-a-backend/auth/set-up-auth/
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
});
