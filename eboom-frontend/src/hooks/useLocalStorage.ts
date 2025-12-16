export const useLocalStorage = () => {
  const getItem = (key: string) => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(key);
  };

  const setItem = (key: string, value: string) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(key, value);
  };

  const removeItem = (key: string) => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(key);
  };

  return { getItem, setItem, removeItem };
};
