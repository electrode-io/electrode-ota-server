import yazl from "yazl";

export default content => {
    const zf = new yazl.ZipFile();
    const output = [];
    zf.outputStream.on("data", c => output.push(c));
    const piss = new Promise(resolve => {
        zf.outputStream.on("end", () => {
        const buf = Buffer.concat(output);
        resolve(buf);
        });
    });
    zf.addBuffer(Buffer.from(content), "yo.txt");
    zf.end();
    return piss;
};
