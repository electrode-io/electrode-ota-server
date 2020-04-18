import diregister from "electrode-ota-server-diregister";
import acquisitionRoutes from "./routes";

export const register = diregister({
    name: "acquisitionRoute",
    dependencies: ["electrode:route", "ota!acquisition", "ota!logger", "ota!ccm"]
}, acquisitionRoutes);
