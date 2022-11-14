export const httpHandler = async (url, options) => {
  return await fetch(url, options)
    .then((res) => {
      return res.json() || {};
    })
    .then((res) => {
      return res;
    })
    .catch((e) => {
      console.error(`${e.name}: ${e.message}`);
      return {};
    });
};
