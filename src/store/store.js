// 存储入口
import {
  createStore,
  applyMiddleware,
  combineReducers
} from 'redux'
import thunk from 'redux-thunk'
import indexReducer from './index'
import userReducer from './user'

const reducer = combineReducers({
  index: indexReducer,
  user: userReducer,
})

// 创建store
// const store = createStore(reducer, applyMiddleware(thunk))

// export default store
// 服务端用dispatch来获取和赋值
export const getServerStore = () => createStore(reducer, applyMiddleware(thunk))

export const getClientStore = () => {
  // 客户端，通过window.__context来获取数据
  const defaultState = window.__context ? window.__context : {}
  return createStore(reducer, defaultState, applyMiddleware(thunk))
}