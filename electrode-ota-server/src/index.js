import path from 'path';
import serverBoot, {DEFAULT_OTA_SERVER_DIRS as dirs} from 'electrode-ota-server-boot';

const boot = (configDir) => {
    return serverBoot(dirs.concat(
        path.join(require.resolve('electrode-ota-server-default-config'), '..'),
        configDir || process.env.OTA_CONFIG_DIR || path.join(process.cwd(), 'config')));
}
export default boot;

if (require.main === module) {
    boot();
}
