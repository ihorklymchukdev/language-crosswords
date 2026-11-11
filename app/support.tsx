import { APP_NAME, CONTACT_EMAIL } from '../src/ui/app-info';
import { ExternalLink, H2, P, TextPage } from '../src/ui/Page';

const MAILTO = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`${APP_NAME} support`)}`;

export default function SupportScreen() {
  return (
    <TextPage title="Support">
      <P>
        {APP_NAME} is a small crossword app for learning Spanish. Each day brings a new puzzle at levels A2, B1 and B2,
        and Practice makes a fresh themed crossword whenever you want one. Everything works offline.
      </P>

      <H2>Where is my progress saved?</H2>
      <P>
        On your device only. Your puzzles, streak and settings are kept in the app's storage (or your browser's local
        storage on the web). Uninstalling the app or clearing the site's data removes them.
      </P>

      <H2>Can I sync between devices?</H2>
      <P>Not yet. There are no accounts, so each device keeps its own progress.</P>

      <H2>A word or clue looks wrong</H2>
      <P>
        Thank you for spotting it. Email us with the puzzle's date and level (for example “11 Nov · B1”) and the clue,
        and we'll fix it in an update.
      </P>

      <H2>Contact</H2>
      <P>
        Email <ExternalLink url={MAILTO}>{CONTACT_EMAIL}</ExternalLink>. We usually reply within a few days.
      </P>
    </TextPage>
  );
}
