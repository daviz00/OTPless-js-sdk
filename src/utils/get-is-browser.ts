export const getIsBrowser = () => {
  return typeof window !== "undefined" ? true : false;
};
