import {
  bindActionCreators
} from "redux";
import axios from 'axios'

// 首页的逻辑
// actionType
const USER_INFO = "USER/USER_INFO";

// actionCreator
const changUserinfo = userinfo => ({
  type: USER_INFO,
  userinfo
});

// dispatch
export const getUserInfo = server => {
  return (dispatch, getState, axiosInstance) => {
    return axios.get("http://localhost:9091/api/user/info").then(res => {
      const {
        data
      } = res.data;
      console.log('data', data)
      dispatch(changUserinfo(data));
    });
  };
};

// initstate
const defaultState = {
  userinfo: {}
};

export default (state = defaultState, action) => {
  switch (action.type) {
    case USER_INFO:
      const newState = {
        ...state,
        userinfo: action.userinfo
      };
      return newState;
    default:
      return state;
  }
};