import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export default async function RootPage() {
  // Get the Accept-Language header from the browser
  const headersList = await headers();
  const acceptLanguage = headersList.get('accept-language') || '';
  
  // Parse the browser's preferred languages
  const preferredLanguages = acceptLanguage
    .split(',')
    .map(lang => lang.split(';')[0].trim().toLowerCase())
    .filter(lang => lang.length > 0);
  
  // Check if English is preferred (en, en-us, etc.)
  const prefersEnglish = preferredLanguages.some(lang => 
    lang.startsWith('en') || lang === 'english'
  );
  
  // Redirect to the appropriate locale home page (Czech is default)
  const locale = prefersEnglish ? 'en' : 'cs';
  redirect(`/${locale}/home`);
}