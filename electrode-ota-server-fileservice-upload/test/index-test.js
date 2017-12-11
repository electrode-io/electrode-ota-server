import {expect} from "chai";
import initDao, {shutdown} from 'electrode-ota-server-test-support/lib/init-dao';
import {fileservice as uploadFactory} from 'electrode-ota-server-fileservice-upload/lib/index';
import {shasum} from 'electrode-ota-server-util';

describe("fileservice/upload", function() {
    this.timeout(200000);

    let upload;
    const content = "This is my upload content";
    before(async () => {
        const dao = await initDao();
        upload = uploadFactory({}, dao);
    });
    after(shutdown);

    it('upload hashes content with sha256', () => {
        const expectedHash = shasum(content);
        return upload(content).then(({packageHash}) => {
            expect(packageHash).is.eql(expectedHash);
        });
    });
    it('upload can save using optional hash paramter', () => {
        const customHash = 'AEB0011443399';
        return upload(content, customHash).then(({packageHash}) => {
            expect(packageHash).is.eql(customHash);
        });
    })
});
