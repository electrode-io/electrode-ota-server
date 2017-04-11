import React, {Component} from 'react';
import Panel, {Heading, Body, Footer, Page, GroupItem} from '../../layouts/Panel';
import {filesize, datetime} from '../../util/fmt';
import Copy from '../../components/Copy';
const sample = {
    "isFetching": false,
    "name": "Staging",
    "key": "hUHJcW4yS9GcUnN7ovmPicyQyQzB4yecGHaB-",
    "package": {
        "appVersion": "1.2.3",
        "blobUrl": "https://codepush.blob.core.windows.net/storagev2/cL-_y8QTVNNiP-GcJ9_5CJsxfcQL4yecGHaB-",
        "description": "",
        "diffPackageMap": {
            "bbc259d25bd31685e9502d8150523614d8f98cf84451caea8e7774ba897e72c4": {
                "size": 174779,
                "url": "https://codepush.blob.core.windows.net/storagev2/2OtuOThIY8G4we037oSeiQ9S7A1-4yecGHaB-"
            }
        },
        "isDisabled": false,
        "isMandatory": false,
        "packageHash": "2b87aaa5d8dd9ea147dcd3933ba494fcc1fb929f4fb74c3fd3a7ceabdb337f26",
        "size": 203914,
        "uploadTime": 1469634661903,
        "releaseMethod": "Rollback",
        "originalLabel": "v2",
        "label": "v4",
        "releasedBy": "speajus@gmail.com"
    }
};

export default class Package extends Component {

    renderNoPackage() {
        return <GroupItem label="No Package"/>;
    }

    renderPackage() {
        const dep = this.props;
        const {
            appVersion, description,
            isDisabled, isMandatory,
            size,
            uploadTime, label, originalLabel, releaseMethod, releasedBy, packageHash
        } = dep.package || {};
        return [
            <GroupItem label="File" key="file-info">
                <dl className="dl-horizontal dl-horizontal-ota">
                    <dt>Size</dt>
                    <dd>{filesize(size)}</dd>

                    <dt>Hash</dt>
                    <dd><Copy text={packageHash}/></dd>
                </dl>
            </GroupItem>,
            <GroupItem label="Release" key="release">
                <dl className="dl-horizontal dl-horizontal-ota">
                    <dt>By</dt>
                    <dd>{releasedBy}</dd>
                    <dt>Time</dt>
                    <dd>{datetime(uploadTime)}</dd>
                    <dt>Method</dt>
                    <dd>{releaseMethod}</dd>
                </dl>
            </GroupItem>];
    }

    render() {
        return <Body>
        {this.props.depKey ? <GroupItem label={`Deployment Key [${this.props.name}] `}>
			<Copy text={this.props.depKey}/>
			</GroupItem> : null}
        {this.props.package ? this.renderPackage() : this.renderNoPackage()}
        </Body>
    }
}
