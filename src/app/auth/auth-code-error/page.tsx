import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function AuthCodeError() {
  const t = useTranslations();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {t('auth.errorTitle')}
        </h1>
        <p className="text-gray-600 mb-6">
          {t('auth.errorMessage')}
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          {t('auth.backToHome')}
        </Link>
      </div>
    </div>
  );
}

