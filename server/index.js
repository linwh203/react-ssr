// 这里的node代码进行babel处理
import React from "react";
import { renderToString } from "react-dom/server";
import express from "express";
import App from "../src/App";

const app = express();
app.use(express.static("public"));

app.get("/", (req, res) => {
  // const Page = <App title={"训练营"}> </App>;
  const content = renderToString(App); // react组件解析成html
  res.send(`
    <html>
      <head>
        <meta charset="utf-8" />
        <title>react ssr</title>
      </head>
      <body>
        <div id="root">${content}</div>
        <script src="/bundle.js"></script>
      </body>
    </html>
  `);
});

app.listen(9000, () => {
  console.log("listen over");
});
