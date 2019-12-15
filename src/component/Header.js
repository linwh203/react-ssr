import React from "react"
import { Link } from "react-router-dom"

export default () => {
  return (
    <div>
      <Link to="/">首页</Link>
      <span> | </span>
      <Link to="/about">关于</Link>
      <span> | </span>
      <Link to="/home">用户</Link>
    </div>
  )
}
