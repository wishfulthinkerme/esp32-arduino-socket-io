import { put, takeEvery } from 'redux-saga/effects';
import get from 'lodash/fp/get';

const URL = '/clients';


function* basic(action) {
  try {
    yield put({ type: 'BASIC.SUCCESS', payload: {} });
  } catch (err) {
    yield put({ type: 'BASIC.ERROR', payload: err });
  }
}


function* basicSaga() {
  yield takeEvery('BASIC', basic);
}

export default [
  basicSaga
];
