import axios from 'axios';
import { showAlert } from './alert';

// type is either 'password' or 'data'
export const updateSettings = async (data, type) => {
  try {
    const url =
      type === 'password'
        ? 'http://127.0.0.1:9009/api/v1/users/updatePassword'
        : 'http://127.0.0.1:9009/api/v1/users/updateMe';
    const res = await axios({
      method: 'PATCH',
      url,
      data,
    });

    const msg =
      type === 'password'
        ? 'Password updated successfully'
        : 'Data updated successfully';

    if (res.data.status === 'success') showAlert('success', msg);
  } catch (error) {
    showAlert('error', error.response.data.message);
  }
};
