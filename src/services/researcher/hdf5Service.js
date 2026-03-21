import { File } from 'jsfive';

export const parseHdf5 = async (fileObject) => {
    const arrayBuffer = await fileObject.arrayBuffer();
    try {
        const f = new File(arrayBuffer, fileObject.name);
        return f;
    } catch (err) {
        throw new Error("Failed to parse HDF5 file: " + err.message);
    }
};
