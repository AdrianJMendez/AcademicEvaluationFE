const apiUrl = import.meta.env.VITE_API_URL?.trim();

if (!apiUrl) {
  throw new Error('La variable VITE_API_URL no esta configurada.');
}

export const env = {
  apiUrl: apiUrl.replace(/\/+$/, ''),
};
