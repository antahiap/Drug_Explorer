const HOST = '172.29.45.53';
const STATIC_URL =
  process.env.NODE_ENV === 'development'
    ? `http://${HOST}:${process.env.REACT_APP_PORT}`
    : './';

const SERVER_URL =
  process.env.NODE_ENV === 'development' ? `http://${HOST}:8002` : './';

export { STATIC_URL, SERVER_URL };
