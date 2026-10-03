# Stylesheet maintenance

Tailwind 3.4.17 utilities are generated from index.html and js/**/*.js. Run npm install and npm run build:css after changing utility classes; commit css/tailwind.css with the source change. Netlify serves the committed CSS without a build command. Add any custom Firestore HTML utility classes to the config safelist before using them; runtime CSS generation is no longer available. Existing custom articles use whitespace-pre-line, which is safelisted.
