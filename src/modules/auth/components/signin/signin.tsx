import { useTranslation } from 'react-i18next';
import { GRANT_TYPES } from '@/constant/auth';
import { Divider } from '@/components/core';
import { SsoSignin } from '../signin-sso';
import { SigninEmail } from '../signin-email';
import { useTheme } from '@/styles/theme/theme-provider';
import darklogo from '@/assets/images/selise_ai_v4.svg';
import lightlogo from '@/assets/images/selise_ai_v4.svg';
import { useGetLoginOptions } from '../../hooks/use-auth';
import { SigninOidc } from '../signin-oidc';

export const Signin = () => {
  const { data: loginOption } = useGetLoginOptions();
  const { theme } = useTheme();
  const { t } = useTranslation();

  const passwordGrantAllowed = !!loginOption?.allowedGrantTypes?.includes(GRANT_TYPES.password);
  const socialGrantAllowed =
    !!loginOption?.allowedGrantTypes?.includes(GRANT_TYPES.social) &&
    !!loginOption?.ssoInfo?.length;
  const oidcGrantAllowed = !!loginOption?.allowedGrantTypes?.includes(GRANT_TYPES.oidc);

  const isDivider = passwordGrantAllowed && (socialGrantAllowed || oidcGrantAllowed);

  return (
    <div className="flex flex-col gap-6 w-[456px]">
      <div className="w-40 h-14">
        <img src={theme == 'dark' ? lightlogo : darklogo} className="w-full h-full" alt="logo" />
      </div>
      <div>
        <div className="text-2xl font-bold text-high-emphasis">{t('LOG_IN')}</div>
        <div className="flex items-center gap-1 mt-1">
          <span className="text-sm font-normal text-medium-emphasis">
            {t('ALREADY_A_BLOCKS_CLOUD_USER')} {t('READY_TO_DIVE_IN')}
          </span>
        </div>
      </div>

      <div className="w-full flex flex-col gap-6 mt-2">
        {passwordGrantAllowed && <SigninEmail />}
        {isDivider && <Divider text={t('AUTH_OR')} />}
        {socialGrantAllowed && loginOption && <SsoSignin loginOption={loginOption} />}
        {oidcGrantAllowed && loginOption && <SigninOidc />}
      </div>
    </div>
  );
};
