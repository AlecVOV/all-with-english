import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

/**
 * Auth: allow.guest() (public strategy over the IAM identity-pool provider).
 * Amplify Data's owner-based authorization only supports the userPools/oidc
 * providers (see @aws-amplify/data-schema Authorization.d.ts — identityPool
 * is not a valid OwnerProvider), so there is no supported way to scope rows
 * per anonymous device without requiring a real Cognito User Pool sign-in.
 * Given the "no login" requirement, every guest session shares one visible
 * pool of word sets — there is no per-student data isolation. If per-user
 * privacy is ever required, it needs real auth (Cognito User Pool) and a
 * switch to allow.owner() (default provider: userPools).
 */
const schema = a.schema({
  WordSet: a
    .model({
      title: a.string().required(),
      wordCount: a.integer().default(0),
      words: a.hasMany('Word', 'wordSetId'),
    })
    .authorization((allow) => [allow.guest()]),

  Word: a
    .model({
      wordSetId: a.id().required(),
      wordSet: a.belongsTo('WordSet', 'wordSetId'),
      term: a.string().required(),
      meaning: a.string().required(),
      order: a.integer().required(),
    })
    .authorization((allow) => [allow.guest()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'identityPool',
  },
});
