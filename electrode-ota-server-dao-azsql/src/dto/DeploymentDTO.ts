export default class DeploymentDTO {
    public id: number;
    public key: string;
    public name: string;
    public createTime: Date;
    // latest package if available
    public package: any;
    // array of package ids, sorted newest first
    // tslint:disable-next-line:variable-name
    public history_: number[];
}
