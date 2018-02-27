import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';
import { reducer as formReducer } from 'redux-form';
import client from './client';


export default combineReducers({
  router: routerReducer,
  form: formReducer,
  client,
});
