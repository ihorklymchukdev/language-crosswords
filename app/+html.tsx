import { ScrollViewStyleReset, useServerDocumentContext } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

// Web-only document shell for the static export. No <title> here: each page renders its own
// (DocumentTitle), and a title in the shell would come first and win.
// headNodes/bodyNodes carry the bundles and styles; without them the page never hydrates.
const DARK_BACKGROUND = '@media (prefers-color-scheme: dark) { html, body { background-color: #0E1116; } }';

export default function Root({ children }: PropsWithChildren) {
  const { htmlAttributes, bodyAttributes, headNodes, bodyNodes } = useServerDocumentContext();
  return (
    <html lang="en" {...htmlAttributes}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="description" content="Daily Spanish mini crosswords for A2–B2 learners. Free, no account. The iOS and Android apps work offline." />
        <meta name="theme-color" content="#FFFFFF" />
        <ScrollViewStyleReset />
        {/* The HTML is rendered light; this keeps dark-mode users from a white flash before hydration. */}
        <style dangerouslySetInnerHTML={{ __html: DARK_BACKGROUND }} />
        {headNodes}
      </head>
      <body {...bodyAttributes}>
        {children}
        {bodyNodes}
      </body>
    </html>
  );
}
