import path from 'path';
export default () => {
    process.env.OTA_CONFIG_DIR = path.join(__dirname, 'config');
    process.env.NODE_ENV = 'test';
    process.env.PORT = 9999;
};
