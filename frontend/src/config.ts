const urlConfigurada =
  import.meta.env.VITE_API_URL?.trim();

export const API_URL = (
  urlConfigurada ||
  'http://localhost:3000'
).replace(/\/+$/, '');
