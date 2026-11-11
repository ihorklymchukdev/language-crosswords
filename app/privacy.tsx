import { APP_NAME, CONTACT_EMAIL } from '../src/ui/app-info';
import { Bullets, ExternalLink, H2, P, TextPage } from '../src/ui/Page';

const GITHUB_PRIVACY = 'https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement';

export default function PrivacyScreen() {
  return (
    <TextPage title="Privacy policy">
      <P muted>Last updated: 11 November 2026</P>
      <P>
        {APP_NAME} is a Spanish crossword app. It collects no personal data. There is no account and nothing to sign up
        for.
      </P>

      <H2>What we collect</H2>
      <Bullets
        items={[
          'No personal data.',
          'No analytics, no advertising and no tracking of any kind.',
          'No data is shared with third parties.',
        ]}
      />

      <H2>What stays on your device</H2>
      <P>
        Your puzzle progress, streak and settings are stored only on your device (AsyncStorage in the app, local storage
        in your browser on the web). They never leave it. They are deleted when you uninstall the app or clear the
        site's data in your browser.
      </P>

      <H2>The web version</H2>
      <P>
        The web version is hosted on GitHub Pages. GitHub may log visitors' IP addresses for security purposes, as
        described in the <ExternalLink url={GITHUB_PRIVACY}>GitHub General Privacy Statement</ExternalLink>.
      </P>

      <H2>Children</H2>
      <P>The app is suitable for all ages. It collects no data from anyone, including children.</P>

      <H2>Changes</H2>
      <P>If this policy changes, the new version will be posted on this page with a new date.</P>

      <H2>Contact</H2>
      <P>
        Questions about privacy: <ExternalLink url={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</ExternalLink>
      </P>
    </TextPage>
  );
}

