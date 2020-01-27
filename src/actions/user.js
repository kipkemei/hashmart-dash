import appConfig from '../config';
import {Redirect} from "react-router-dom";
import React from "react";

export const LOGIN_REQUEST = 'LOGIN_REQUEST';
export const LOGIN_SUCCESS = 'LOGIN_SUCCESS';
export const LOGIN_FAILURE = 'LOGIN_FAILURE';
export const LOGOUT_REQUEST = 'LOGOUT_REQUEST';
export const LOGOUT_SUCCESS = 'LOGOUT_SUCCESS';
export const LOGOUT_FAILURE = 'LOGOUT_FAILURE';

function requestLogin(creds) {
  return {
    type: LOGIN_REQUEST,
    isFetching: true,
    isAuthenticated: false,
    creds,
  };
}

export function receiveLogin(user) {
  return {
    type: LOGIN_SUCCESS,
    isFetching: false,
    isAuthenticated: true,
    id_token: user.token,
  };
}

function loginError(message) {
  return {
    type: LOGIN_FAILURE,
    isFetching: false,
    isAuthenticated: false,
    message,
  };
}

function requestLogout() {
  return {
    type: LOGOUT_REQUEST,
    isFetching: true,
    isAuthenticated: true,
  };
}

export function receiveLogout() {
  return {
    type: LOGOUT_SUCCESS,
    isFetching: false,
    isAuthenticated: false,
  };
}

// Logs the user out
export function logoutUser() {
  return dispatch => {
    dispatch(requestLogout());
    // localStorage.removeItem('id_token');
    // localStorage.removeItem('created');
    // localStorage.removeItem('token');
    document.cookie = 'id_token=;expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    dispatch(receiveLogout());
  };
}

export function loginUser(creds) {
  return dispatch => {
    // We dispatch requestLogin to kickoff the call to the API
    dispatch(requestLogin(creds));
    let data ={
      "email": creds.email,
      "password": creds.password
    };
    console.log("CREDS", creds, data);
    creds.that.services.login(data).then(resp=> {
      creds.that.setState({
        isLoading: false,
      });
      localStorage.setItem("id_token", resp.data.token);
      localStorage.setItem("token", resp.data.token);
      localStorage.setItem("name", resp.data.name);
      localStorage.setItem("email", resp.data.email);
      localStorage.setItem("created", new Date().toString());
        dispatch(receiveLogin(resp));
        return <Redirect to={"/app"} />;
        // return Promise.resolve(resp);
    }).catch(err => {
      console.error('Error: ', err);
      dispatch(loginError(""));
      return Promise.reject(err);
    });
  }
}

export function loginUsers(creds) {
  const config = {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    credentials: 'include',
    body: `login=${creds.login}&password=${creds.password}`,
  };
  
  return dispatch => {
    // We dispatch requestLogin to kickoff the call to the API
    dispatch(requestLogin(creds));
    if(process.env.NODE_ENV === "development") {
    return fetch('/login', config)
      .then(response => response.json().then(user => ({ user, response })))
      .then(({ user, response }) => {
        if (!response.ok) {
          // If there was a problem, we want to
          // dispatch the error condition
          dispatch(loginError(user.message));
          return Promise.reject(user);
        }
        // in posts create new action and check http status, if malign logout
        // If login was successful, set the token in local storage
        localStorage.setItem('id_token', user.id_token);
        // Dispatch the success action
        dispatch(receiveLogin(user));
        return Promise.resolve(user);
      })
      .catch(err => console.error('Error: ', err));
    } else {
      localStorage.setItem('id_token', appConfig.id_token);
      dispatch(receiveLogin({id_token: appConfig.id_token}))
    }
  };
}
