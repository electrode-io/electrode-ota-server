import path from 'path';
import serverBoot, {DEFAULT_OTA_SERVER_DIRS as dirs} from 'electrode-ota-server-boot';

export default () =>{
    return serverBoot( dirs.concat(
        path.join(require.resolve('electrode-ota-server-default-config'), '..'),
        process.env.OTA_CONFIG_DIR || path.join(process.cwd(), 'config')));
}

if (require.main === module) {
    serverBoot();
}
