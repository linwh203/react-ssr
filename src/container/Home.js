import React, { useState, useEffect } from "react"
import { connect } from "react-redux"
import { getUserInfo } from "../store/user"

function User(props) {
  // console.log(props)
  return (
    <div>
      <h1> home page {props.userinfo.name}! </h1>{" "}
      <p> best: {props.userinfo.best} </p>
    </div>
  )
}
User.loadData = store => {
  return store.dispatch(getUserInfo())
}

export default connect(
  state => {
    console.log("home page state", state.user.userinfo)
    return {
      userinfo: state.user.userinfo
    }
  },
  // ({ userinfo: state.user.userinfo })
  {
    // getUserInfo
  }
)(User)
