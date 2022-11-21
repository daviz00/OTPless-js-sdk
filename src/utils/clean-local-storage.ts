import { STATE_LOCAL_STORAGE_KEY } from "../constants";
export const cleanUpLocalStorage = () => {
  localStorage.removeItem(STATE_LOCAL_STORAGE_KEY);
};
