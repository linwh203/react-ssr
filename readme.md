## react ssr 训练笔记

单页面应用（SPA）在传统的实现）上，面临着首页白屏加载时间过长，seo 难以优化的难题。解决这个问题的思路之一就是 ssr（服务端渲染）。

无论 react 或 vue，代码都包括组件，store，component 等。共同通向一个 app.js，我们把 app.js 通过 webpack 分成两个 bundle，一个是服务端的 html（ssr），一个是客户端定义交互操作的 js（csr），这个过程称之为同构。

react-dom 提供了 server 的渲染 api：`renderToString`,它可以把 react 组件解析为 html。因为在服务端渲染，而服务端本身是不支持 jsx 的。使用 babel-loader，可以帮助在服务端解析 jsx。

### 环境搭建

初始化 npm

```
mkdir ssr
cd ssr
npm init -y
```

在项目中新建 src，下面新建 App.js

```react
import React,{useState} from 'react';

function App(props){
    const [count,setCount]=useState(1);
    return <div>
        <h1>{props.title}:react ssr</h1>
        <span>{count}</span><br/>
        <button onClick={()=>{setCount(count+1)}}>+</button>
    </div>
}

export default <App title="kkb" />;
```

在项目根目录新建`webpack.server.js`:

```js
// 服务端webpack
const path = require("path")
const nodeExternals = require("webpack-node-externals")

module.exports = {
  target: "node",
  mode: "development",
  entry: "./server/index.js", //服务端要打包的入口
  externals: [nodeExternals()],
  output: {
    // 定义输出目录和文件名
    filename: "bundle.js",
    path: path.resolve(__dirname, "build")
  },
  module: {
    rules: [
      {
        test: /\.js$/, // 规则
        loader: "babel-loader", // 使用babel-loader解析
        exclude: /node_modules/,
        options: {
          // 支持jsx和最新的js写法
          presets: ["@babel/preset-react", ["@babel/preset-env"]]
        }
      }
    ]
  }
}
```

然后在命令行安装用到的库：

```
npm i webpack webpack-cli webpack-node-externals @babel/core @babel/preset-env @babel/preset-react -D
```

安装完之后，开始写服务端。

### 服务端渲染（SSR）

在 package.json 增加两条指令

```json
  "scripts": {
    "dev:server": "webpack --config webpack.server.js --watch",
    "dev:start": "node --watch build --exec node \"./build/bundle.js\""
  },
```

`npm run dev:server`执行打包服务端的 bundle。

`npm run dev:start`则是启动你的 node 服务。

理论上不管服务端选用哪种框架，只要是 node 环境即可。在此处以 express 为例.在根目录创建 server/index.js

因为已经支持 babel，所以可以使用 import 和 jsx 了。

```js
import React from "react"
import { renderToString } from "react-dom/server"
import express from "express"
import App from "../src/App"

const app = express()
// 把public作为网站跟路由
app.use(express.static("public"))

app.get("/", (req, res) => {
  // react组件解析为dom
  const content = renderToString(App)
  // 直接返回一个html模板
  res.send(`
    <html>
        <head>
            <meta charset="UTF-8">
            <title>react ssr</title>
            <body>
                <div id="root">${content}</div>
            </body>
        </head>
    </html>
    `)
})
// 监听9000端口
app.listen(9000, () => {
  console.log("server is runing..")
})
```

写完之后安装一下用到的库：

```
npm i react react-dom express -S
```

安装好后，ssr 就初步完成了。

```js
# 打包服务端bundle.js
npm run dev:server
# 运行node
npm run dev:start
```

打开`http://localhost:9000`看到页面

### 客户端注水：CSR

想要真的能交互，离不开客户端 js 的加载。怎么做呢？我们也在根目录配置一个 webpack.client.js——用于在浏览器执行的 js：

```js
const path = require("path")

module.exports = {
  mode: "development",
  entry: "./client/index.js", //入口
  output: {
    filename: "bundle.js", //期望在public下创建bundle
    path: path.resolve(__dirname, "public")
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: "babel-loader",
        exclude: /node_modules/,
        options: {
          presets: ["@babel/preset-react", ["@babel/preset-env"]]
        }
      }
    ]
  }
}
```

相对于服务端的 webpack.server.js，此处省去了很多 node 才有的配置。

在上面的代码中，我们制定了客户端 js 的入口，所以在根目录下创建`/client/index.js`：

在这里，我们通过`hydrate`（react 服务端渲染方法，替代旧有的 reactDom.render）完成注水工作：

```js
// /client/index.js
import React from "react"
import ReacDom from "react-dom"
import App from "../src/App"

// 客户端
// 注水：不需render
ReacDom.hydrate(App, document.querySelector("#root"))
```

然后增加一条打包`/client/index.js`的指令：

```json
  "scripts": {
    "dev:client": "webpack --config webpack.client.js --watch",
    "dev:server": "webpack --config webpack.server.js --watch",
    "dev:start": "node --watch build --exec node \"./build/bundle.js\""
  },
```

执行`npm run dev:client`，就生成了一个 public 文件夹，下有你打包好的客户端 bundle.js

### 组合

你的应用想要使用客户端的 bundle.js 可以在 node 服务中这么写：

```js
// ...
const app = express()
// 把public作为网站跟路由
app.use(express.static("public"))
app.get("/", (req, res) => {
  // react组件解析为dom
  const content = renderToString(App)
  // 直接返回一个html模板,带上你的bundle引用！
  res.send(`
    <html>
        <head>
            <meta charset="UTF-8">
            <title>react ssr</title>
            <body>
                <div id="root">${content}</div>
								<script src="bundle.js"></script>
            </body>
        </head>
    </html>
    `)
})
```

现在可以运行看看了，

```
# 分别执行客户端和服务端打包
npm run dev:server
npm run dev:client

# 启node服务
npm run dev:start
```

然后在 9000 端口，就可以看到计数器了。

如果我想支持更多的服务端渲染，比如 router 和 redux，应该怎么操作呢？请期待下期分解。

---

### 命令行合并工具 concurrently

现在已经有了三条指令，做项目时，必须启动三个窗口，给开发带来了不便。npm 上的开源库 concurrently 把它们整合为一条命令，可以提升开发体验。

> <https://www.npmjs.com/package/concurrently>

不用管太多，直接安装：

```
npm i concurrently -S
```

假设我需要一条前端最熟悉的`npm start`来启动我们的开发，那么需要在 package.json 配置一条 start 命令：

```json
"start":"concurrently \"npm run dev:client\" \"npm run dev:server\" \"npm run dev:start\"",
```

安装配置完之后，就可以愉快地使用傻瓜式指令 npm start 了。

### ssr 路由渲染

在客户端，假如访问一个路由`/about`，让 js 监听当前 url 变化来实现。但在服务端（node），就有很多需要注意的地方。

> 阅读资料，给出了最简单的方法：
>
> <https://reacttraining.com/react-router/web/guides/server-rendering>
>
> Rendering on the server is a bit different since it’s all stateless. The basic idea is that we wrap the app in a stateless \<StaticRouter\> instead of a \<BrowserRouter\>. We pass in the requested url from the server so the routes can match and a context prop we’ll discuss next.
>
> ```react
> // client
> <BrowserRouter>
>   <App/>
> </BrowserRouter>
>
> // server (not the complete story)
> <StaticRouter
>   location={req.url}
>   context={context}
> >
>   <App/>
> </StaticRouter>
> ```
>
> react-router-dom 开发了两套路由：StaticRouter 和 BrowserRouter，分别对应服务端和客户端的渲染。

在命令行安装 router：

```
npm i react-router-dom -S
```

接下来我们对自身的代码做点改造：

（1）在 src 下创建`container`和`component`文件夹，container 创建两个页面 Index 和 About，

Index 直接照搬原来的计数器（App.js）代码，About 简单写一写：

```react
import React from 'react';

function About(props){
    return <div>
        <h1>about</h1>
    </div>
}

export default About;
```

（2）两个页面写好后，App.js 改造成全局应用的入口

```react
import Reactfrom 'react';
import {Route} from 'react-router-dom';

import Index from './container/Index';
import About from './container/About';

export default (
    <div>
        <Route exact path="/" component={Index} />
        <Route exact path="/" component={About} />
    </div>
);

```

服务端（server/index.js）怎么写呢？考虑监听一个通配符`*`，然后把 req.url 绑定到服务端路由上，交给 react 的`StaticRouter`去处理。

```react
import React from 'react';
import {renderToString} from 'react-dom/server';
import express from 'express';
import {StaticRouter} from 'react-router-dom';
import App from '../src/App';

const app=express();

app.use(express.static('public'));

// 监听所有页面
app.get('*',(req,res)=>{
    // react组件解析为html
    const content=renderToString(
        <StaticRouter location={req.url}>
            {App}
        </StaticRouter>
    );
    res.send(`
    <html>
        <head>
            <meta charset="UTF-8">
            <title>react ssr</title>
            <body>
                <div id="root">${content}</div>
                <script src="bundle.js"></script>
            </body>
        </head>
    </html>
    `)
});

app.listen(9000,()=>{
    console.log('server is runing..')
});
```

作为客户端（client/index.js）同构，也这样处理：

```js
import React from "react"
import ReacDom from "react-dom"
import { BrowserRouter } from "react-router-dom"
import App from "../src/App"

const Page = <BrowserRouter>{App}</BrowserRouter>

// 客户端
// 注水：不需render
ReacDom.hydrate(Page, document.querySelector("#root"))
```

ssr 路由渲染基本功能就完成了。

### ssr 支持 redux

store 本质是数据。如果要进行同构必定包含 client 和 server 两端。

如果数据流是异步的，在 client 端无非就是 componentDidAmount。在 server 端逻辑也是基本一致的。本节将就异步数据流同构的实现进行讲解。

**需求**：通过 redux 在首页渲染一个课程列表。

安装 react-redux，redux，axios 和 redux-thunk

```
npm i react-redux axios redux redux-thunk -S
```

在 src 下创建一个 store 文件夹：

创建 store.js

```js
// 储存的入口
import { createStore, applyMiddleware, combineReducers } from "redux"
import thunk from "thunk"
import indexReducer from "./index"

const reducer = combineReducers({
  index: indexReducer
})

// 创建store
const store = createStore(reducer, applyMiddleware(thunk))

export default store
```

#### 定义 store 和 mock 数据

接下来要模拟一个接口，假设这个接口是 9001 端口：

在 sotore 文件夹下继续创建 index.js，负责 index 首页的状态业务：

```js
// 定义actionType
const GET_LIST = "INDEX/GET_LIST"

// actionCreator
const changeList = list => ({
  type: GET_LIST,
  list
})

// 获取方法，假设我从9001端口获取数据
export const getIndexList = server => {
  return (dispatch, getState, axiosInstance) => {
    return axios.get("http://localhost:9001/course/list").then(res => {
      const { list } = res.data
      dispatch(changeList(list))
    })
  }
}

// 初始状态
const defaultState = {
  list: []
}

export default (state = defaultState, action) => {
  switch (action.type) {
    case GET_LIST:
      const newState = {
        ...state,
        list: action.list
      }
      return newState
    default:
      return state
  }
}
```

在项目中创建一个 mock.j，作为 9001 的服务：

```js
// 单纯模拟接口
const express=require('express');
const app=express();

app.get('/course/list',(req,res)=>{
    // 支持跨域
    res.header('Access-Control-Allow-Origin','*');
    res.header('Access-Control-Methods','GET,POST,PUT,DELETE');
    res.header('Content-Type','application/json;charset=utf-8');

    res.json({
        code:0,
        list:[
            {id:1,name:'javascript 从helloworld到放弃'},
            {id:2,name:'背锅的艺术'},
            {id:3,name:'撸丝程序员如何征服女测试'},
            {id:4,name:'python从入门到跑路'}
        ]
    });
});

app.listen('9001',()=>{
    console.log('mock has started..')；
});
```

注意：mock.js 相对独立于此项目，也就是说，逻辑上你应该独立启动该服务。

#### 应用 redux

对页面应用 redux 也是分为三部分，

（1）组件应用 redux

```react
// 客户端
import React,{useState,useEffect} from 'react';
import {connect} from 'react-redux';
import {getIndexList} from '../store/index';

function Index(props){
    const [count,setCount]=useState(1);
    useEffect(()=>{
        props.getIndexList();
    },[]);
    return <div>
        <h1>react ssr</h1>
        <span>{count}</span><br/>
        <button onClick={()=>{setCount(count+1)}}>+</button><hr/>
        <ul>
            {props.list.map((item,index)=>(
                <li key={index}>{item.id}-{item.name}</li>
            ))}
        </ul>
    </div>
}

export default connect(
    state=>({list:state.index.list}),
    {getIndexList}
)(Index);
```

（2）客户端思路是用 useEffect 拿到请求方法，用 provider 传递状态：

```js
import React from "react"
import ReacDom from "react-dom"
import { BrowserRouter } from "react-router-dom"

import { Provider } from "react-redux"
import store from "../src/store/store"
import App from "../src/App"

const Page = (
  <Provider store={store}>
    <BrowserRouter>{App}</BrowserRouter>
  </Provider>
)

// 客户端
// 注水：不需render
ReacDom.hydrate(Page, document.querySelector("#root"))
```

（3）在服务端操作完全一样：

```react
// ...
import {Provider} from 'react-redux';
import store from '../src/store/store';
import App from '../src/App';

// ...
// 监听所有页面
app.get('*',(req,res)=>{
    // react组件解析为html
    const content=renderToString(
        <Provider store={store}>
            <StaticRouter location={req.url}>
            {App}
        </StaticRouter>
        </Provider>
    );
    res.send(`
    <html>
        <head>
            <meta charset="UTF-8">
            <title>react ssr</title>
            <body>
                <div id="root">${content}</div>
                <script src="bundle.js"></script>
            </body>
        </head>
    </html>
    `)
});
```

看到此页面，我们已经通过通过 ssr 完成了基本的 redux 管理。

---

### 服务端数据的异步获取

后端 ssr 只是渲染了网页模板（ul），列表（li）的 html 都是异步请求加载出来的。再回看首页列表的代码：

```react
// src/container/Index.js
import React,{useState,useEffect} from 'react';
import {connect} from 'react-redux';
import {getIndexList} from '../store/index';

function Index(props){
    const [count,setCount]=useState(1);
    useEffect(()=>{
        props.getIndexList();
    },[]);
    return <div>
        <h1>react ssr</h1>
        <span>{count}</span><br/>
        <button onClick={()=>{setCount(count+1)}}>+</button><hr/>
        <ul>
            {props.list.map((item,index)=>(
                <li key={index}>{item.id}-{item.name}</li>
            ))}
        </ul>
    </div>
}

export default connect(
    state=>({list:state.index.list}),
    {getIndexList}
)(Index);
```

这里的过程是：Index 作为一个纯组件，在加载之后（componentDIdAmount），通过 redux dispatch 一个请求。拿到我们 mock 的数据，传入到首页到 props 中，再执行渲染。

问题来了：异步数据（useEffect）能否再后端执行渲染完了再传给前端呢？

解决的思路在于**store 的初始值**。

```js
// 创建store
const store = createStore(reducer, 初始值, applyMiddleware(thunk))
```

createStore 可以插入第二个参数，放入初始值，因此考虑把获取初始值放到 server 端去做。**此时服务端和客户端的 store 已经分离**。

思路既已确定，就衍生了两个需要解决的问题：

1. 在某个路由加载时，我们如何知道哪个 store 需要在服务端完成？
2. 多个数据如何加载到 props 中？

#### server 层异步获取

`useEffect`既然需要在服务端获取，所以在 Index 代码中就可以注释掉了。同时给 Index 写一个 loadData 方法：

```js
// src/container/Index.js
// ...
function Index(props) {
  const [count, setCount] = useState(1)
  // useEffect(()=>{
  //     props.getIndexList();
  // },[]);
  return (
    <div>
      <h1>react ssr</h1>
      <span>{count}</span>
      <br />
      <button
        onClick={() => {
          setCount(count + 1)
        }}
      >
        +
      </button>
      <hr />
      <ul>
        {props.list.map((item, index) => (
          <li key={index}>
            {item.id}-{item.name}
          </li>
        ))}
      </ul>
    </div>
  )
}
// 给组件传递一个方法
Index.loadData = store => {
  return store.dispatch(getIndexList())
}
// ...
```

接下来看如何在 server 端获取数据。

> 阅读文档：<https://reacttraining.com/react-router/web/guides/server-rendering> 的 data loading 部分：
>
> There are so many different approaches to this, and there’s no clear best practice yet, so we seek to be composable with any approach, and not prescribe or lean toward one or the other. We’re confident the router can fit inside the constraints of your application.
>
> The primary constraint is that you want to load data before you render. React Router exports the `matchPath` static function that it uses internally to match locations to routes. You can use this function on the server to help determine what your data dependencies will be before rendering.
>
> The gist of this approach relies on a static route config used to both render your routes and match against before rendering to determine data dependencies.
>
> 关于数据在服务端加载，目前还没有一个明确的最佳实践。但思路都是通过配置路由来实现。你可以给路由传递一些组件的自定义的属性（比如获取数据的方法 loadData）。这样，你就可以在服务端拿到请求数据的方法了。
>
> React Router 提供了**matchPath 方法**，可以在服务端内部用于将定向与路由匹配。你可以在服务端上使用此方法来匹配路由。此方法的要点在于：在请求拿到异步数据之前，基于静态路由配置来实现路由匹配。

接下来考虑路由获取动态配置来实现路由，在这里配置写成像 vue 一样：

```js
// src/App.js
//...
// export default (
//     <div>
//         <Route exact path="/" component={Index} />
//         <Route exact path="/about" component={About} />
//     </div>
// );
// 改造成根据配置来实现路由
export default [
    {
        path:'/',
        component:Index,
        exact:true,
        key:'index'，
     		// 你甚至可以在这里定义你的方法比如`loadData：Index.loadData`
      	// 但是这里loadData已经是Index的属性了。
    },
    {
        path:'/about',
        component:About,
        exact:true,
        key:'about'
    }
]
```

接下来在服务端应用`matchPath`方法：

```react
// App实际上就是route
import { StaticRouter, matchPath,Route} from 'react-router-dom';
import routes from '../src/App';

// 监听所有页面
app.get('*', (req, res) => {
    // 【总体思路】根据路由获取到的组件，并且拿到loadData，获取数据
		// ------------
    // 1.定义一个数组来存放所有网络请求
    const promises = [];
    // 2.遍历来匹配路由，
    routes.forEach(route => {
        // 3.通过 `matchPath` 判断当前是否匹配
        const match = matchPath(req.path, route);
        if (match) {
            const { loadData } = route.component;
            if (loadData) {
                promises.push(loadData(store));
            }
        }
    });

    // 4.等待所有的请求结束后，再返回渲染逻辑
    Promise.all(promises).then(data => {
        // do something w/ the data so the client
        // react组件解析为html
        const content = renderToString(
            <Provider store={store}>
                <StaticRouter location={req.url}>
                   {/*route此时是一个数组，因此需要map出来*/}
                   {routes.map(route => <Route {...route} />)}
                </StaticRouter>
            </Provider>
        );
        res.send(`
            <html>
                <head>
                    <meta charset="UTF-8">
                    <title>react ssr</title>
                    <body>
                        <div id="root">${content}</div>
                        <script src="bundle.js"></script>
                    </body>
                </head>
            </html>
            `);
    });

});
```

此时需要注意的是，原来的 App 已经变成了一个数组，在客户端也作如下修改：

```react
// client/index.js
import store from '../src/store/store';
import routes from '../src/App';

const Page = (<Provider store={store}>
    <BrowserRouter>
        {routes.map(route => <Route {...route} />)}
    </BrowserRouter>
</Provider>);
```

自此，我们已经完成了在服务端获取数据的工作。

#### store 的区分

但是之前说过 store 也需要区分，分别供服务端和客户端获取使用。服务端如何告知前端，"我帮你把数据请求到了"呢？思路是在渲染模板时，放到全局变量里。

```js
// 创建store
// const store = createStore(reducer, applyMiddleware(thunk));
// export default store;

// 服务端用
export const getServerStore=()=>{
    return createStore(reducer, applyMiddleware(thunk));
}

export const getClientStore=()=>{
    // 把初始状态放到window.__context中，作为全局变量,以此来获取数据。
    const defaultState=window.__context?window.__context:{};
    return createStore(reducer, defaultState,applyMiddleware(thunk))；
}
```

```js
// server/index.js
import { getServerStore } from "../src/store/store"
const store = getServerStore()
//...
res.send(`<html>
    <head>
        <meta charset="UTF-8">
        <title>react ssr</title>
        <body>
            <div id="root">${content}</div>
            <script>window.__context=${JSON.stringify(
              store.getState()
            )}</script>
            <script src="bundle.js"></script>
        </body>
    </head>
</html>`)
```

同理，客户端也改造下：

```react
// client/index.js
// ...
import {getClientStore} from '../src/store/store';
import {Route} from 'react-router-dom';
import routes from '../src/App';

const Page = (<Provider store={getClientStore()}>
    <BrowserRouter>
        {routes.map(route => <Route {...route} />)}
    </BrowserRouter>
</Provider>);

// 客户端
// 注水：不需render
ReacDom.hydrate(Page, document.querySelector('#root'));
```

刷新右键查看源代码，内容都传递进来了。

### 引入公共组件

现在我们要在`src/component`下新增加一个 Header，作为公用组件，它提供多个页面下不同路由的导航跳转功能。代码如下：

```react
import React from 'react';
import {Link} from 'react-router-dom';

function Header(){
    return (<div>
        <Link to='/'>首页</Link>
        <Link to='about'>关于</Link>
    </div>)
}

export default Header;
```

公共组件应当如何同构呢？

操作是几乎一样的：

```react
// server/index.js
// ...
import Header from '../src/component/Header';
const content = renderToString(
    <Provider store={store}>
        <StaticRouter location={req.url}>
        <Header/>
        {routes.map(route => <Route {...route} />)}
        </StaticRouter>
    </Provider>
);
//...
```

```react
// client/index.js
// ...
import Header from '../src/component/Header';
const Page = (<Provider store={getClientStore()}>
    <BrowserRouter>
        <Header/>
        {routes.map(route => <Route {...route} />)}
    </BrowserRouter>
</Provider>);
```

### 前后端统一数据请求

我们首次直接访问 about 路由，查看源代码，发现`__context`是空的。

这个很好理解，因为匹配不到。这时再跳转首页。你发现列表加载不出来了。因为没有客户端并未执行网络请求。

这个问题也很好解决，还记得最初注释掉的`useEffect`吗？再客户端组件代码中，当发现数据为空时，执行网络请求即可。

```react
function Index(props){
    const [count,setCount]=useState(1);
  	// 增加客户端请求判断
    useEffect(()=>{
        if(!props.list.length){
            props.getIndexList();
        }
    },[]);
    return <div>
        <h1>react ssr</h1>
        <span>{count}</span><br/>
        <button onClick={()=>{setCount(count+1)}}>+</button><hr/>
        <ul>
            {props.list.map((item,index)=>(
                <li key={index}>{item.id}-{item.name}</li>
            ))}
        </ul>
    </div>
}
```

问题就解决了。

### 新增 User 页面

现在再快速把之前的逻辑重复操作一遍。

1. 新建一个`User`组件，业务逻辑是：通过 store 展示用户个人信息。

```react
import React ,{useState,useEffect} from 'react';
import {connect} from 'react-redux';
import {getUserInfo} from '../store/user';

function User(props){
    useEffect(()=>{
        if(!props.info.name){
            props.getUserInfo();
        }
    },[]);
    const {name,honor}=props.info;
    return <div>
        <h1>你好，{name}，你当前的成就是：
        <span style={{textDecoration:'underline'}}>{honor}</span>
        </h1>
    </div>
}

User.loadData=(store)=>{
    return store.dispatch(getUserInfo());
}
export default connect(
    state=>({info:state.user.info}),
    {getUserInfo}
)(User);
```

2. 因此需要在 store 下新建一个`user.js`模块:

```js
import axios from "axios"

// 定义actionType
const GET_INFO = "INDEX/GET_USERINFO"

// actionCreator
const changeList = info => ({
  type: GET_INFO,
  info
})

// 异步的dispatchAction
export const getUserInfo = server => {
  return (dispatch, getState, axiosInstance) => {
    // 返回promise
    return axios.get("http://localhost:9001/user/info").then(res => {
      const { info } = res.data
      dispatch(changeList(info))
    })
  }
}

// 初始状态
const defaultState = {
  info: {
    name: "",
    honor: ""
  }
}

export default (state = defaultState, action) => {
  switch (action.type) {
    case GET_INFO:
      const newState = {
        ...state,
        info: action.info
      }
      return newState
    default:
      return state
  }
}
```

3. 然后我们在 store.js 中新增一个 userReducer：

```js
// store.js
// ...
import userReducer from "./user"

const reducer = combineReducers({
  index: indexReducer,
  user: userReducer
})
```

4. 在路由中增加一个 User 路由：

```js
// App.js
import User from "./container/User"

export default [
  // ...
  {
    path: "/user",
    component: User,
    exact: true,
    key: "user"
  }
]
```

并在 header 更新：

```react
function Header(){
    return (<div>
        <Link to='/'>首页</Link>|
        <Link to='/about'>关于</Link>|
        <Link to='/user'>用户</Link>
    </div>)
}
```

5. 最后在 mock.js 新增一个接口：

```js
// mock.js
app.get("/user/info", (req, res) => {
  // 支持跨域
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Methods", "GET,POST,PUT,DELETE")
  res.header("Content-Type", "application/json;charset=utf-8")

  res.json({
    code: 0,
    info: {
      name: "党某某",
      honor: "首席背锅工程师"
    }
  })
})
```

### 容错处理

容错处理的关键在于：找到报错的地方。

先来看场景：

> react-router 可以精确匹配，也可以非精确匹配，在 App.js 中，如果注释掉`exact:true`：
>
> ```js
> export default [
>   {
>     path: "/",
>     component: Index,
>     // exact:true,
>     key: "index"
>   },
>   {
>     path: "/user",
>     component: User,
>     exact: true,
>     key: "user"
>   }
> ]
> ```
>
> 将会非精确匹配，你会看到两个页面。

假设 mockjs 中，前端把获取用户信息的接口误写为：`http://localhost:9001/user/info1`，这时应定位到 server.js 中的 promise.all 方法。因此设置一个 catch 即可。

```js
Promise.all(promises).then(data=>{
  //...
}).catch(e=>{
   res.send(`错误：${e}`);
})；
```

> ## 作业 1
>
> A: Promise.all 如何忽略接口报错的页面部分，渲染成功的部分
> Q: new Promise 包裹页面 promise，使 catch 也 resolve 掉
>
> ## 作业 2
>
> A: 所有 api 和页面请求统一由 server 端转发
