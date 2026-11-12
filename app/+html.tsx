import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

// Web only: page background, text selection and caret colors follow the app palette.
const webStyles = `
body { background-color: #F5F6F8; -webkit-font-smoothing: antialiased; }
::selection { background: #CFDCF7; color: #0F2A66; }
input, textarea { caret-color: #2155C4; }
`;

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="vi">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <title>Quản lý giảng viên</title>
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: webStyles }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
