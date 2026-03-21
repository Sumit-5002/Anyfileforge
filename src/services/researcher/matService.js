import * as hdf5 from 'jsfive';

export const parseMat = async (file) => {
    const ab = await file.arrayBuffer();
    const dataView = new DataView(ab);
    
    // Check for MAT v5 header
    const headerStr = new TextDecoder().decode(ab.slice(0, 128));
    if (headerStr.startsWith('MATLAB 5.0 MAT-file')) {
        return {
            totalBytes: ab.byteLength,
            version: '5.0',
            status: "MAT v5 Workspace Loaded (Metadata only support)",
            variables: ["Metadata view only - v5 proprietary parser required for full dive"]
        };
    }

    // Check if it's MAT v7.3 (HDF5)
    try {
        const h5file = new hdf5.File(ab, file.name);
        return {
            totalBytes: ab.byteLength,
            version: '7.3 (HDF5)',
            status: "MAT v7.3 Workspace Loaded",
            isHdf5: true,
            h5file
        };
    } catch (e) {
        return {
            totalBytes: ab.byteLength,
            version: 'Unknown',
            status: "Unknown MAT version or corrupted file.",
            variables: []
        };
    }
};
