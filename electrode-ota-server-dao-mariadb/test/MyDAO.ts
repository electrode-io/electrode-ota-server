import ElectrodeOtaDaoRdbms from "../src/ElectrodeOtaDaoRdbms";
import MyPoolCluster from "./MyPoolCluster";

export default class MyDAO extends ElectrodeOtaDaoRdbms {
    constructor() {
        super();
        this.setPoolClusterForTest(new MyPoolCluster());
    }
}
