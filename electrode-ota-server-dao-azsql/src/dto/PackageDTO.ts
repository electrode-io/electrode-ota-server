export default class PackageDTO {
    public id: number;
    public appVersion: string;
    public blobUrl: string;
    // matching the expected interface
    // tslint:disable-next-line:variable-name
    public created_: Date;
    public description: string;
    public diffPackageMap: any;
    public isDisabled: boolean;
    public isMandatory: boolean;
    public label: string;
    public manifestBlobUrl: string;
    public originalDeployment: string;
    public originalLabel: string;
    public packageHash: string;
    public releaseMethod: string;
    public releasedBy: string;
    public rollout: number;
    public size: number;
    public uploadTime: Date;
    public tags?: string[];
}
