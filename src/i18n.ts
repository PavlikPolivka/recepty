import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => {
  // Ensure we have a valid locale, fallback to 'cs' (Czech)
  const validLocale = (locale && ['en', 'cs'].includes(locale)) ? locale : 'cs';
  
  return {
    messages: (await import(`../messages/${validLocale}.json`)).default,
    locale: validLocale
  };
});
