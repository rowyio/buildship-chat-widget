import { readFileSync, writeFileSync } from "fs";
import { minify } from "html-minifier";

const html = readFileSync("./src/widget.html").toString();
writeFileSync(
  "./src/widgetHtmlString.ts",
  `export const widgetHTML = \`${minify(html, {
    collapseWhitespace: true,
    collapseInlineTagWhitespace: true,
    removeComments: true,
  })}\`;\n`
);
