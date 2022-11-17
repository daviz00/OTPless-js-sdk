export const httpHandler = async (url: string, options: Object) => {
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
