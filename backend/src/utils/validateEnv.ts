import { cleanEnv, EnvError, makeValidator, port, str, url } from 'envalid';

const sessionSecret = makeValidator<string>(value => {
  if (value.length < 32 || /\s/.test(value) || /^<.*>$/.test(value) || /^(?:change[-_]?me|replace[-_]?me|placeholder)+$/i.test(value)) {
    throw new EnvError('Generera en unik SECRET_KEY med openssl rand -hex 32; exempelvärden är inte tillåtna.');
  }

  return value;
});

// NOTE: Make sure we got these in ENV
const validateEnv = () => {
  cleanEnv(process.env, {
    NODE_ENV: str(),
    SECRET_KEY: sessionSecret(),
    API_BASE_URL: str(),
    CLIENT_KEY: str(),
    CLIENT_SECRET: str(),
    PORT: port(),
    BASE_URL_PREFIX: str(),
    ORIGIN: str(),
    SAML_CALLBACK_URL: url(),
    SAML_LOGOUT_CALLBACK_URL: url(),
    SAML_FAILURE_REDIRECT: url(),
    SAML_SUCCESS_REDIRECT: url(),
    SAML_ENTRY_SSO: url(),
    SAML_ISSUER: str(),
    SAML_IDP_PUBLIC_CERT: str(),
    SAML_PRIVATE_KEY: str(),
    SAML_PUBLIC_KEY: str(),
  });
};

export default validateEnv;
