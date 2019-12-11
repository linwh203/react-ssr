import {
  bindActionCreators
} from "redux";
import axios from 'axios'

// 首页的逻辑
// actionType
const GET_LIST = "INDEX/GET_LIST";

// actionCreator
const changList = list => ({
  type: GET_LIST,
  list
});

// dispatch
export const getIndexList = server => {
  return (dispatch, getState, axiosInstance) => {
    return axios.get("http://localhost:9091/api/course/list").then(res => {
      const {
        list
      } = res.data;
      dispatch(changList(list));
    });
  };
};

// initstate
const defaultState = {
  list: []
};

export default (state = defaultState, action) => {
  switch (action.type) {
    case GET_LIST:
      const newState = {
        ...state,
        list: action.list
      };
      return newState;
    default:
      return state;
  }
};