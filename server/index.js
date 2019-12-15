// 这里的node代码进行babel处理
import React from "react"
import { renderToString } from "react-dom/server"
import express from "express"
import { StaticRouter, matchPath, Route } from "react-router-dom"
import { Provider } from "react-redux"
import { getServerStore } from "../src/store/store"
import routes from "../src/App"
import Header from "../src/component/Header"

const store = getServerStore()
const app = express()
app.use(express.static("public"))

// 使接口报错依然能渲染页面
const resolvePromise = promise =>
  new Promise(resolve => {
    promise.then(res => resolve(res)).catch(e => resolve())
  })

app.get("*", (req, res) => {
  // 获取根据路由渲染出的组件，并且拿到loadData方法获取数据
  // 存储网络请求
  const promises = []
  routes.some(route => {
    const match = matchPath(req.path, route)
    if (match) {
      const { loadData } = route.component
      if (loadData) {
        promises.push(resolvePromise(loadData(store)))
      }
    }
  })
  // 等待所有网络请求后渲染
  Promise.all(promises)
    .then(() => {
      const content = renderToString(
        <Provider store={store}>
          <StaticRouter location={req.url}>
            <Header></Header>
            {routes.map(route => (
              <Route {...route}></Route>
            ))}
          </StaticRouter>
        </Provider>
      ) // react组件解析成html
      res.send(`
    <html>
      <head>
        <meta charset="utf-8" />
        <title>react ssr</title>
      </head>
      <body>
        <div id="root">${content}</div>
        <script>
            window.__context = ${JSON.stringify(store.getState())}
        </script>
        <script src="/bundle.js"></script>
      </body>
    </html>
  `)
    })
    .catch(e => {
      res.send(`
        <html>
          <head>
            <meta charset="utf-8" />
            <title>react ssr</title>
          </head>
          <body>
            error
          </body>
        </html>
      `)
    })
})

app.listen(9000, () => {
  console.log("listen over")
})
