import React from "react"
import { Route } from "react-router-dom"
import Index from "./container/Index"
import About from "./container/About"
import Home from "./container/Home"

// export default (
//   <div className="App">
//     <Route path="/" exact component={Index}></Route>
//     <Route path="/about" exact component={About}></Route>
//   </div>
// )

// 路由改造成js配置才能获取组件
export default [
  {
    path: "/",
    component: Index,
    // loadData: Index.loadData,
    // exact: true,
    key: "index"
  },
  {
    path: "/about",
    component: About,
    exact: true,
    key: "about"
  },
  {
    path: "/home",
    component: Home,
    exact: true,
    key: "home"
  }
]
